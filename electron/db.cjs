const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

// Create/open the database in the user's data directory
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "pos.db");
console.log(`Local database path: ${dbPath}`);

const db = new Database(dbPath);

const VALID_TABLES = new Set([
	"license_activate",
	"users",
	"accounting_transaction_mode",
	"config_data",
	"core_products",
	"core_customers",
	"core_vendors",
	"core_users",
	"order_process",
	"sales",
	"purchase",
	"invoice_table",
	"categories",
	"invoice_table_item",
	"temp_sales_products",
	"temp_purchase_products",
	"printer",
]);

// Rejects any table name not in VALID_TABLES — prevents SQL injection via table names
const validateTableName = (table) => {
	if (typeof table !== "string") throw new Error(`Invalid table name: ${table}`);
	const normalized = table.replace(/-/g, "_");
	if (!VALID_TABLES.has(normalized)) {
		throw new Error(`Invalid table name: ${table}`);
	}
	return normalized;
};

// Only allows simple column names like "id", "sales_price", "created_at"
// Rejects anything with spaces, semicolons, quotes, or other SQL-special characters
const SAFE_IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9_]*$/;

const validateIdentifier = (name, label = "identifier") => {
	if (typeof name !== "string" || !SAFE_IDENTIFIER.test(name)) {
		throw new Error(`Invalid ${label}: ${name}`);
	}
	return name;
};

// Prevents injection via operators in getJoinedTableData conditions
// e.g. passing "= 1; DROP TABLE sales; --" as an operator
const VALID_SQL_OPERATORS = new Set([
	"=",
	"!=",
	"<>",
	">",
	"<",
	">=",
	"<=",
	"LIKE",
	"NOT LIKE",
	"IN",
	"NOT IN",
]);

// Validates all field names in search objects (equals, like, in) before they reach SQL
const validateSearchFields = (search) => {
	if (!search || typeof search !== "object") return;
	for (const group of ["equals", "like", "in"]) {
		if (search[group] && typeof search[group] === "object") {
			for (const field of Object.keys(search[group])) {
				validateIdentifier(field, "search field");
			}
		}
	}
};

// license activate table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS license_activate (
		id INTEGER PRIMARY KEY,
		license_key TEXT,
		active_key TEXT,
		is_activated INTEGER,
		activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
).run();

// users table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY,
		name TEXT,
		mobile TEXT,
		email TEXT,
		username TEXT,
		user_group TEXT,
		domain_id INTEGER,
		access_control_role TEXT,
		android_control_role TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
).run();

// accounting_transaction_mode table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS accounting_transaction_mode (
		id INTEGER PRIMARY KEY,
		is_selected INTEGER,
		name TEXT,
		slug TEXT,
		service_charge REAL,
		account_owner TEXT,
		path TEXT,
		short_name TEXT,
		authorized_name TEXT,
		account_type_name TEXT,
		method_name TEXT,
		method_slug TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
  	`
).run();

// config_data table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS config_data (
		id INTEGER PRIMARY KEY,
		data TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
).run();

// core_products table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS core_products (
		id INTEGER PRIMARY KEY,
		vendor_id INTEGER,
		stock_id INTEGER,
		product_name TEXT NOT NULL,
		name TEXT NOT NULL,
		product_nature TEXT NOT NULL,
		display_name TEXT NOT NULL,
		purchase_item_for_sales TEXT DEFAULT '[]',
		measurements TEXT DEFAULT '[]',
		slug TEXT NOT NULL,
		category_id INTEGER,
		category TEXT,
		unit_id INTEGER NOT NULL,
		quantity REAL NOT NULL,
		total_sales REAL DEFAULT 0,
		average_price REAL DEFAULT 0,
		purchase_price REAL NOT NULL,
		sales_price REAL NOT NULL,
		barcode TEXT,
		unit_name TEXT NOT NULL,
		feature_image TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
).run();

// core_customers table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS core_customers (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		mobile TEXT,
		address TEXT,
		email TEXT,
		code INTEGER,
		customer_id TEXT NOT NULL,
		alternative_mobile TEXT,
		reference_id TEXT,
		credit_limit REAL,
		customer_group_id INTEGER,
		unique_id TEXT,
		slug TEXT NOT NULL,
		marketing_id INTEGER,
		marketing_username TEXT,
		marketing_email TEXT,
		location_id INTEGER,
		location_name TEXT,
		created_date DATE DEFAULT CURRENT_DATE,
		created_at TEXT,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		debit REAL DEFAULT 0,
		credit REAL DEFAULT 0,
		balance REAL DEFAULT 0,
		is_new INTEGER DEFAULT 0
	);
  	`
).run();

// core_vendors table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS core_vendors (
		id INTEGER PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		vendor_code VARCHAR(255) NOT NULL,
		code INTEGER NOT NULL,
		company_name VARCHAR(255),
		slug VARCHAR(255) NOT NULL,
		address VARCHAR(255),
		email VARCHAR(255),
		mobile VARCHAR(20),
		unique_id VARCHAR(255) NOT NULL,
		sub_domain_id INTEGER,
		customer_id INTEGER,
		created_date DATE,
		created_at TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
  	`
).run();

// core_users table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS core_users (
		id INTEGER PRIMARY KEY,
		name VARCHAR(255),
		username VARCHAR(255) NOT NULL,
		email VARCHAR(255),
		mobile VARCHAR(20),
		created_date DATE NOT NULL,
		created_at TIMESTAMP NOT NULL,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		access_control_role JSON,
		android_control_role JSON
	);
  	`
).run();

// order_process table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS order_process (
		id INTEGER PRIMARY KEY,
		label VARCHAR(255) NOT NULL,
		value INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
  	`
).run();

// sales table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS sales (
		id INTEGER PRIMARY KEY,
		created DATE DEFAULT CURRENT_DATE,
		invoice TEXT,
		sub_total REAL,
		total REAL,
		approved_by_id INTEGER,
		payment REAL,
		discount REAL,
		is_domain_sales_completed INTEGER,
		discount_calculation REAL,
		discount_type TEXT,
		invoice_batch_id INTEGER,
		customerId INTEGER,
		customerName TEXT,
		customerMobile TEXT,
		createdByUser TEXT,
		createdByName TEXT,
		createdById INTEGER,
		salesById INTEGER,
		salesByUser TEXT,
		salesByName TEXT,
		process TEXT,
		mode_name TEXT,
		customer_address TEXT,
		customer_group TEXT,
		balance REAL,
		sales_items TEXT,
		multi_transaction INTEGER DEFAULT 0,
		payments TEXT,
		status TEXT DEFAULT 'completed',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
  	`
).run();

// purchase table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS purchase (
		id INTEGER PRIMARY KEY,
		created DATE DEFAULT CURRENT_DATE,
		invoice TEXT,
		sub_total REAL,
		total REAL,
		payment REAL,
		discount REAL,
		discount_calculation REAL,
		discount_type TEXT,
		approved_by_id INTEGER,
		vendor_id INTEGER,
		vendor_name TEXT,
		createdByUser TEXT,
		createdByName TEXT,
		createdById INTEGER,
		process TEXT,
		mode_name TEXT,
		transaction_mode_id INTEGER,
		balance REAL,
		purchase_items TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
  	`
).run();

// invoice table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS invoice_table (
		id INTEGER PRIMARY KEY,
		config_id INTEGER,
		created_by_id INTEGER,
		table_id INTEGER,
		sales_by_id INTEGER,
		serve_by_id INTEGER,
		transaction_mode_id INTEGER,
		customer_id INTEGER,
		invoice_mode TEXT,
		process TEXT,
		is_active INTEGER,
		order_date TEXT,
		sub_total REAL,
		payment REAL,
		table_nos TEXT,
		discount_type TEXT,
		total REAL,
		vat REAL,
		sd REAL,
		discount REAL,
		percentage INTEGER,
		discount_calculation INTEGER,
		discount_coupon TEXT,
		remark TEXT,
		particular_name TEXT,
		particular_slug TEXT,
		customer_name TEXT,
		customer_mobile TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`
).run();

// categories table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS categories (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		slug TEXT NOT NULL,
		item INTEGER DEFAULT 0,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)
	`
).run();

// invoice table item
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS invoice_table_item (
		id INTEGER PRIMARY KEY,
		stock_item_id INTEGER,
		invoice_id INTEGER,
		display_name TEXT NOT NULL,
		quantity REAL NOT NULL,
		quantity_limit REAL DEFAULT 0,
		purchase_price REAL,
		sales_price REAL NOT NULL,
		custom_price INTEGER NOT NULL,
		is_print INTEGER NOT NULL,
		sub_total REAL NOT NULL,
		batches TEXT DEFAULT '[]',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`
).run();

// temp sales table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS temp_sales_products (
		id INTEGER PRIMARY KEY,
		product_id INTEGER,
		display_name TEXT NOT NULL,
		sales_price REAL NOT NULL,
		category_id INTEGER,
		category_name TEXT,
		mrp REAL DEFAULT 0,
		price REAL NOT NULL,
		percent REAL NOT NULL,
		stock REAL NOT NULL,
		quantity REAL NOT NULL,
		unit_name TEXT NOT NULL,
		purchase_price REAL NOT NULL,
		average_price REAL DEFAULT 0,
		sub_total REAL NOT NULL,
		unit_id INTEGER,
		warehouse_id INTEGER,
		expired_date TEXT,
		warehouse_name TEXT,
		bonus_quantity REAL,
		measurement TEXT,
		measurement_quantity REAL,
		type TEXT CHECK(type IN ('sales', 'sales_return')) DEFAULT 'sales',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`
).run();

// temp purchase table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS temp_purchase_products (
		id INTEGER PRIMARY KEY,
		product_id INTEGER,
		display_name TEXT,
		category_id INTEGER,
		category_name TEXT,
		quantity REAL,
		unit_name TEXT,
		mrp REAL DEFAULT 0,
		purchase_price REAL,
		average_price REAL DEFAULT 0,
		sub_total REAL,
		expired_date TEXT,
		sales_price REAL,
		warehouse_id INTEGER,
		warehouse_name TEXT,
		bonus_quantity REAL,
		measurement TEXT,
		measurement_quantity REAL,
		type TEXT CHECK(type IN ('purchase', 'purchase_return', 'requisition')) DEFAULT 'purchase',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`
).run();

// printer table
db.prepare(
	`
	CREATE TABLE IF NOT EXISTS printer (
		id INTEGER PRIMARY KEY,
		printer_name TEXT NOT NULL DEFAULT 'POS-PRINT',
		line_character TEXT DEFAULT '=',
		character_set TEXT DEFAULT 'PC437_USA',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	)`
).run();

// core_products: searched by barcode (POS scan), category, vendor
db.prepare("CREATE INDEX IF NOT EXISTS idx_products_barcode ON core_products(barcode)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_products_category ON core_products(category_id)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_products_vendor ON core_products(vendor_id)").run();

// core_customers: searched by mobile (lookup at checkout), email
db.prepare("CREATE INDEX IF NOT EXISTS idx_customers_mobile ON core_customers(mobile)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_customers_code ON core_customers(code)").run();

// core_vendors: searched by vendor_code, mobile
db.prepare("CREATE INDEX IF NOT EXISTS idx_vendors_code ON core_vendors(vendor_code)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_vendors_mobile ON core_vendors(mobile)").run();

// sales: filtered by date (daily reports), customer, status
db.prepare("CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customerId)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status)").run();

// purchase: filtered by date, vendor
db.prepare("CREATE INDEX IF NOT EXISTS idx_purchase_created ON purchase(created)").run();
db.prepare("CREATE INDEX IF NOT EXISTS idx_purchase_vendor ON purchase(vendor_id)").run();

// invoice_table_item: looked up by invoice_id (loading invoice line items)
db.prepare(
	"CREATE INDEX IF NOT EXISTS idx_invoice_item_invoice ON invoice_table_item(invoice_id)"
).run();
db.prepare(
	"CREATE INDEX IF NOT EXISTS idx_invoice_item_stock ON invoice_table_item(stock_item_id)"
).run();

// temp tables: filtered by type and product_id
db.prepare("CREATE INDEX IF NOT EXISTS idx_temp_sales_type ON temp_sales_products(type)").run();
db.prepare(
	"CREATE INDEX IF NOT EXISTS idx_temp_purchase_type ON temp_purchase_products(type)"
).run();

const formatValue = (value) => {
	if (value === undefined || value === null) return null;
	try {
		if (typeof value === "object") return JSON.stringify(value);
		if (typeof value === "boolean") return value ? 1 : 0;
	} catch (e) {
		console.error(`Failed to stringify value: ${value}`, e);
		return null;
	}
	return value;
};
const getTableColumns = (table) => {
	const columns = db.prepare(`PRAGMA table_info(${table})`).all();
	return columns.map((col) => col.name);
};

const upsertIntoTable = (table, data) => {
	try {
		table = validateTableName(table);
		const columns = getTableColumns(table);

		const validData = Object.keys(data)
			.filter((key) => columns.includes(key))
			.reduce((obj, key) => {
				obj[key] = formatValue(data[key]);
				return obj;
			}, {});

		if (columns.includes("updated_at") && validData.updated_at === undefined) {
			validData.updated_at = new Date().toISOString();
		}

		const keys = Object.keys(validData);
		const placeholders = keys.map(() => "?").join(", ");
		const updateSetAssignments = keys.map((key) => `${key} = excluded.${key}`).join(", ");

		const stmt = db.prepare(
			`INSERT INTO ${table} (${keys.join(", ")})
			VALUES (${placeholders})
			ON CONFLICT(id) DO UPDATE SET ${updateSetAssignments}`
		);

		stmt.run(...Object.values(validData));
	} catch (e) {
		console.log("Error in upsertIntoTable for this data:", table, data);
		console.error(e);
	}
};

const getDataFromTable = (table, idOrConditions, property = "id", options = {}) => {
	table = validateTableName(table);
	const useGet = ["config_data", "users", "license_activate", "printer"].includes(table); // return a single row for these tables

	let stmt;
	let result;

	const { limit, offset, search, orderBy } = options || {};
	validateSearchFields(search);

	// =============== safe order by: "id ASC" or "created_at DESC" etc. (column name + optional ASC/DESC) ===============
	const orderByClause = (() => {
		if (!orderBy || typeof orderBy !== "string") return "ORDER BY created_at DESC";
		const trimmed = orderBy.trim();
		if (!trimmed) return "ORDER BY created_at DESC";
		const parts = trimmed.split(/\s+/);
		const column = parts[0];
		const direction = (parts[1] || "ASC").toUpperCase();
		if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(column)) return "ORDER BY created_at DESC";
		if (direction !== "ASC" && direction !== "DESC") return "ORDER BY created_at DESC";
		return `ORDER BY ${column} ${direction}`;
	})();

	const buildSearchClause = (initialConditions = [], initialValues = []) => {
		const conditions = [...initialConditions];
		const values = [...initialValues];

		if (search && typeof search === "object") {
			if (search.equals && typeof search.equals === "object") {
				for (const [field, value] of Object.entries(search.equals)) {
					if (value !== undefined && value !== null && value !== "") {
						conditions.push(`${field} = ?`);
						values.push(value);
					}
				}
			}

			if (search.like && typeof search.like === "object") {
				for (const [field, value] of Object.entries(search.like)) {
					if (value !== undefined && value !== null && value !== "") {
						conditions.push(`${field} LIKE ?`);
						values.push(`%${value}%`);
					}
				}
			}

			if (search.in && typeof search.in === "object") {
				for (const [field, list] of Object.entries(search.in)) {
					if (Array.isArray(list) && list.length > 0) {
						const placeholders = list.map(() => "?").join(", ");
						conditions.push(`${field} IN (${placeholders})`);
						values.push(...list);
					}
				}
			}
		}

		return { conditions, values };
	};

	const buildPaginatedQuery = (baseQuery, baseValues = []) => {
		let query = baseQuery;
		const values = [...baseValues];

		if (!useGet && typeof limit === "number") {
			query += " LIMIT ?";
			values.push(limit);
		}

		if (!useGet && typeof offset === "number") {
			query += " OFFSET ?";
			values.push(offset);
		}

		return { query, values };
	};

	if (typeof idOrConditions === "object" && idOrConditions !== null) {
		// multiple conditions
		const keys = Object.keys(idOrConditions);
		keys.forEach((key) => validateIdentifier(key, "column"));
		const baseConditions = keys.map((key) => `${key} = ?`);
		const baseValues = keys.map((key) => idOrConditions[key]);

		const { conditions, values } = buildSearchClause(baseConditions, baseValues);
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		if (useGet) {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ${orderByClause}`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.get(...finalValues);
		} else {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ${orderByClause}`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.all(...finalValues);
		}
	} else if (idOrConditions) {
		validateIdentifier(property, "property");
		stmt = db.prepare(`SELECT * FROM ${table} WHERE ${property} = ?`);
		result = stmt.get(idOrConditions);
	} else {
		const { conditions, values } = buildSearchClause([], []);
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		if (useGet) {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ${orderByClause}`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.get(...finalValues);
		} else {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ${orderByClause}`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.all(...finalValues);
		}
	}

	return result;
};

const updateDataInTable = (table, { id, data, condition = {}, property = "id" }) => {
	table = validateTableName(table);
	const columns = getTableColumns(table);
	const updatePayload = { ...data };

	if (columns.includes("updated_at") && updatePayload.updated_at === undefined) {
		updatePayload.updated_at = new Date().toISOString();
	}

	// build SET clause
	const setKeys = Object.keys(updatePayload);
	setKeys.forEach((key) => validateIdentifier(key, "column"));
	const setClause = setKeys.map((key) => `${key} = ?`).join(", ");
	const setValues = setKeys.map((key) => updatePayload[key]);

	// build WHERE clause
	let whereClause = "";
	let whereValues = [];

	if (id !== undefined) {
		// backward compatible: use id + property
		validateIdentifier(property, "property");
		whereClause = `WHERE ${property} = ?`;
		whereValues = [id];
	} else if (typeof condition === "object" && Object.keys(condition).length > 0) {
		const conditionKeys = Object.keys(condition);
		conditionKeys.forEach((key) => validateIdentifier(key, "column"));
		whereClause = "WHERE " + conditionKeys.map((key) => `${key} = ?`).join(" AND ");
		whereValues = conditionKeys.map((key) => condition[key]);
	} else {
		throw new Error("No condition provided for update");
	}

	const stmt = db.prepare(`UPDATE ${table} SET ${setClause} ${whereClause}`);
	stmt.run(...setValues, ...whereValues);
};

const deleteDataFromTable = (table, idOrConditions = 1, property = "id") => {
	table = validateTableName(table);
	let stmt;
	if (typeof idOrConditions === "object" && idOrConditions !== null) {
		// multiple conditions
		const keys = Object.keys(idOrConditions);
		keys.forEach((key) => validateIdentifier(key, "column"));
		const conditions = keys.map((key) => `${key} = ?`).join(" AND ");
		const values = keys.map((key) => idOrConditions[key]);
		stmt = db.prepare(`DELETE FROM ${table} WHERE ${conditions}`);
		stmt.run(...values);
	} else {
		validateIdentifier(property, "property");
		stmt = db.prepare(`DELETE FROM ${table} WHERE ${property} = ?`);
		stmt.run(idOrConditions);
	}
};

const deleteManyFromTable = (table, ids = [], property = "id") => {
	if (!Array.isArray(ids) || ids.length === 0) return;

	table = validateTableName(table);

	// Create ?,?,? placeholders dynamically
	const placeholders = ids.map(() => "?").join(",");

	validateIdentifier(property, "property");
	const stmt = db.prepare(`DELETE FROM ${table} WHERE ${property} IN (${placeholders})`);

	return stmt.run(...ids);
};

const destroyTableData = (table = "users") => {
	table = validateTableName(table);
	const stmt = db.prepare(`DELETE FROM ${table}`);
	stmt.run();
};

const getTableCount = (table, conditions = {}, options = {}) => {
	try {
		table = validateTableName(table);

		let query = `SELECT COUNT(*) as total FROM ${table}`;
		let whereClauses = [];
		let values = [];

		if (conditions && typeof conditions === "object" && Object.keys(conditions).length > 0) {
			Object.keys(conditions).forEach((key) => validateIdentifier(key, "column"));
			whereClauses = Object.keys(conditions).map((key) => `${key} = ?`);
			values.push(...Object.keys(conditions).map((key) => conditions[key]));
		}

		const { search } = options || {};
		validateSearchFields(search);

		if (search && typeof search === "object") {
			if (search.equals && typeof search.equals === "object") {
				for (const [field, value] of Object.entries(search.equals)) {
					if (value !== undefined && value !== null && value !== "") {
						whereClauses.push(`${field} = ?`);
						values.push(value);
					}
				}
			}

			if (search.like && typeof search.like === "object") {
				for (const [field, value] of Object.entries(search.like)) {
					if (value !== undefined && value !== null && value !== "") {
						whereClauses.push(`${field} LIKE ?`);
						values.push(`%${value}%`);
					}
				}
			}

			if (search.in && typeof search.in === "object") {
				for (const [field, list] of Object.entries(search.in)) {
					if (Array.isArray(list) && list.length > 0) {
						const placeholders = list.map(() => "?").join(", ");
						whereClauses.push(`${field} IN (${placeholders})`);
						values.push(...list);
					}
				}
			}
		}

		if (whereClauses.length > 0) {
			query += ` WHERE ${whereClauses.join(" AND ")}`;
		}

		const row = db.prepare(query).get(...values);
		return row ? row.total : 0;
	} catch (error) {
		console.error("Error in getTableCount:", error);
		return 0;
	}
};

const resetDatabase = async () => {
	try {
		const tables = db
			.prepare(
				`
			SELECT name
			FROM sqlite_master
			WHERE type='table'
			AND name NOT LIKE 'sqlite_%'
		`
			)
			.all()
			.map((row) => row.name);

		db.prepare("PRAGMA foreign_keys = OFF").run();

		const dropTxn = db.transaction((tableNames) => {
			for (const table of tableNames) {
				db.prepare(`DROP TABLE IF EXISTS "${table}"`).run();
			}
		});

		dropTxn(tables);

		db.prepare("PRAGMA foreign_keys = ON").run();

		console.log("All tables dropped successfully");
	} catch (error) {
		console.error("Error in resetDatabase:", error);
	}
};

const getJoinedTableData = ({
	table1,
	table2,
	foreignKey,
	conditions = {},
	select = {
		table1: ["*"], // ['id', 'name', 'price'] or ['*'] for all columns
		table2: ["*"], // ['id', 'name'] or ['*'] for all columns
	},
	rename = {}, // { 'table1.id': 'product_id', 'table2.name': 'category_name' }
	pagination = {
		limit: 50,
		offset: 0,
	},
	search = {}, // { field: 'name', value: 'bread' }
}) => {
	try {
		table1 = validateTableName(table1);
		table2 = validateTableName(table2);
		validateIdentifier(foreignKey, "foreign key");

		// Get all columns for both tables
		const table1Columns = db
			.prepare(`PRAGMA table_info(${table1})`)
			.all()
			.map((col) => col.name);
		const table2Columns = db
			.prepare(`PRAGMA table_info(${table2})`)
			.all()
			.map((col) => col.name);

		// Build select clause
		const buildSelectClause = (table, columns, alias, availableColumns) => {
			if (columns.includes("*")) {
				return availableColumns.map((col) => `${alias}.${col}`).join(", ");
			}
			return columns
				.map((col) => {
					const renameKey = `${table}.${col}`;
					const newName = rename[renameKey] || col;
					return `${alias}.${col} as ${newName}`;
				})
				.join(", ");
		};

		const table1Select = buildSelectClause(table1, select.table1, "p", table1Columns);
		const table2Select = buildSelectClause(table2, select.table2, "s", table2Columns);

		// Build the base query
		let query = `
			SELECT ${table1Select}, ${table2Select}
			FROM ${table1} p
			LEFT JOIN ${table2} s ON p.${foreignKey} = s.id
		`;

		// Add conditions if provided
		if (Object.keys(conditions).length > 0) {
			const conditionClauses = Object.entries(conditions).map(([key, value]) => {
				validateIdentifier(key, "condition column");
				if (typeof value === "object") {
					// Handle operators like IN, LIKE, etc.
					const [operator, operand] = Object.entries(value)[0];
					if (!VALID_SQL_OPERATORS.has(operator.toUpperCase())) {
						throw new Error(`Invalid SQL operator: ${operator}`);
					}
					return `p.${key} ${operator} ?`;
				}
				return `p.${key} = ?`;
			});

			query += ` WHERE ${conditionClauses.join(" AND ")}`;
		}

		// Prepare and execute the query
		const stmt = db.prepare(query);
		const values = Object.values(conditions).map((value) => {
			if (typeof value === "object") {
				return Object.values(value)[0];
			}
			return value;
		});

		return stmt.all(...values);
	} catch (error) {
		console.error("Error in getJoinedTableData:", error);
		throw error;
	}
};

const clearAndInsertBulk = (table, dataArray, options = {}) => {
	const { batchSize = 500, onProgress = null } = options;

	try {
		table = validateTableName(table);
		const total = dataArray.length;

		const bulkOperation = db.transaction(() => {
			db.prepare(`DELETE FROM ${table}`).run();

			let inserted = 0;
			for (let offset = 0; offset < total; offset += batchSize) {
				const batch = dataArray.slice(offset, offset + batchSize);
				for (const data of batch) {
					upsertIntoTable(table, data);
				}
				inserted += batch.length;

				if (typeof onProgress === "function") {
					onProgress({
						table,
						inserted,
						total,
						percent: Math.round((inserted / total) * 100),
					});
				}
			}
		});

		bulkOperation();

		console.log(`Successfully cleared and inserted ${total} records into ${table}`);
	} catch (error) {
		console.error(`Error in clearAndInsertBulk for table ${table}:`, error);
		throw error;
	}
};

const close = () => {
	db.close();
};

module.exports = {
	upsertIntoTable,
	getDataFromTable,
	updateDataInTable,
	deleteDataFromTable,
	deleteManyFromTable,
	destroyTableData,
	clearAndInsertBulk,
	resetDatabase,
	getJoinedTableData,
	getTableCount,
	close,
};
