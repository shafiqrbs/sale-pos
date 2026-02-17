const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

// Create/open the database in the user's data directory
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "pos.db");
console.log(`Local database path: ${dbPath}`);

const db = new Database(dbPath);

const convertTableName = (key) => key.replace(/-/g, "_");

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
		slug TEXT NOT NULL,
		category_id INTEGER,
		unit_id INTEGER NOT NULL,
		quantity REAL NOT NULL,
		total_sales REAL DEFAULT 0,
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
		code INTEGER NOT NULL,
		customer_id TEXT NOT NULL,
		alternative_mobile TEXT,
		reference_id TEXT,
		credit_limit REAL,
		customer_group_id INTEGER,
		unique_id TEXT NOT NULL,
		slug TEXT NOT NULL,
		marketing_id INTEGER,
		marketing_username TEXT,
		marketing_email TEXT,
		location_id INTEGER,
		location_name TEXT,
		created_date TEXT NOT NULL,
		created_at TEXT NOT NULL,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		debit REAL NOT NULL,
		credit REAL NOT NULL,
		balance REAL NOT NULL,
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
		created_date DATE NOT NULL,
		created_at TIMESTAMP NOT NULL,
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
		customerId INTEGER,
		customerName TEXT,
		customerMobile TEXT,
		createdByUser TEXT,
		createdByName TEXT,
		createdById INTEGER,
		process TEXT,
		mode_name TEXT,
		customer_address TEXT,
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
		price REAL NOT NULL,
		percent REAL NOT NULL,
		stock REAL NOT NULL,
		quantity REAL NOT NULL,
		unit_name TEXT NOT NULL,
		purchase_price REAL NOT NULL,
		sub_total REAL NOT NULL,
		unit_id INTEGER,
		warehouse_id INTEGER,
		warehouse_name TEXT,
		bonus_quantity REAL,
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
		quantity REAL,
		unit_name TEXT,
		purchase_price REAL,
		sub_total REAL,
		sales_price REAL,
		warehouse_id INTEGER,
		warehouse_name TEXT,
		bonus_quantity REAL,
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
// data insertion into the table
const upsertIntoTable = (table, data) => {
	try {
		table = convertTableName(table);
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

		const existingRow = db.prepare(`SELECT id FROM ${table} WHERE id = ?`).get(validData.id);

		if (!existingRow) {
			stmt.run(...Object.values(validData));
		} else {
			const existingData = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(validData.id);

			const isChanged = keys.some((key) => {
				const existingValue =
					typeof existingData[key] === "string" && existingData[key].startsWith("{")
						? JSON.parse(existingData[key])
						: existingData[key];

				const newValue =
					typeof validData[key] === "string" && validData[key].startsWith("{")
						? JSON.parse(validData[key])
						: validData[key];

				return JSON.stringify(existingValue) !== JSON.stringify(newValue);
			});

			if (isChanged) {
				stmt.run(...Object.values(validData));
			}
		}
	} catch (e) {
		console.log("Error in upsertIntoTable for this data:", table, data);
		console.error(e);
	}
};

const getDataFromTable = (table, idOrConditions, property = "id", options = {}) => {
	table = convertTableName(table);
	const useGet = ["config_data", "users", "license_activate", "printer"].includes(table); // return a single row for these tables

	let stmt;
	let result;

	const { limit, offset, search } = options || {};

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
		const baseConditions = keys.map((key) => `${key} = ?`);
		const baseValues = keys.map((key) => idOrConditions[key]);

		const { conditions, values } = buildSearchClause(baseConditions, baseValues);
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		if (useGet) {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ORDER BY created_at DESC`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.get(...finalValues);
		} else {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ORDER BY created_at DESC`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.all(...finalValues);
		}
	} else if (idOrConditions) {
		stmt = db.prepare(`SELECT * FROM ${table} WHERE ${property} = ?`);
		result = stmt.get(idOrConditions);
	} else {
		const { conditions, values } = buildSearchClause([], []);
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

		if (useGet) {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ORDER BY created_at DESC`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.get(...finalValues);
		} else {
			const { query, values: finalValues } = buildPaginatedQuery(
				`SELECT * FROM ${table} ${whereClause} ORDER BY created_at DESC`,
				values
			);
			stmt = db.prepare(query);
			result = stmt.all(...finalValues);
		}
	}

	return result;
};

const updateDataInTable = (table, { id, data, condition = {}, property = "id" }) => {
	table = convertTableName(table);
	const columns = getTableColumns(table);
	const updatePayload = { ...data };

	if (columns.includes("updated_at") && updatePayload.updated_at === undefined) {
		updatePayload.updated_at = new Date().toISOString();
	}

	// build SET clause
	const setKeys = Object.keys(updatePayload);
	const setClause = setKeys.map((key) => `${key} = ?`).join(", ");
	const setValues = setKeys.map((key) => updatePayload[key]);

	// build WHERE clause
	let whereClause = "";
	let whereValues = [];

	if (id !== undefined) {
		// backward compatible: use id + property
		whereClause = `WHERE ${property} = ?`;
		whereValues = [id];
	} else if (typeof condition === "object" && Object.keys(condition).length > 0) {
		const conditionKeys = Object.keys(condition);
		whereClause = "WHERE " + conditionKeys.map((key) => `${key} = ?`).join(" AND ");
		whereValues = conditionKeys.map((key) => condition[key]);
	} else {
		throw new Error("No condition provided for update");
	}

	const stmt = db.prepare(`UPDATE ${table} SET ${setClause} ${whereClause}`);
	stmt.run(...setValues, ...whereValues);
};

const deleteDataFromTable = (table, idOrConditions = 1, property = "id") => {
	table = convertTableName(table);
	let stmt;
	if (typeof idOrConditions === "object" && idOrConditions !== null) {
		// multiple conditions
		const keys = Object.keys(idOrConditions);
		const conditions = keys.map((key) => `${key} = ?`).join(" AND ");
		const values = keys.map((key) => idOrConditions[key]);
		stmt = db.prepare(`DELETE FROM ${table} WHERE ${conditions}`);
		stmt.run(...values);
	} else {
		stmt = db.prepare(`DELETE FROM ${table} WHERE ${property} = ?`);
		stmt.run(idOrConditions);
	}
};

const deleteManyFromTable = (table, ids = [], property = "id") => {
	if (!Array.isArray(ids) || ids.length === 0) return;

	table = convertTableName(table);

	// Create ?,?,? placeholders dynamically
	const placeholders = ids.map(() => "?").join(",");

	const stmt = db.prepare(`DELETE FROM ${table} WHERE ${property} IN (${placeholders})`);

	return stmt.run(...ids);
};

const destroyTableData = (table = "users") => {
	const stmt = db.prepare(`DELETE FROM ${table}`);
	stmt.run();
};

const getTableCount = (table, conditions = {}, options = {}) => {
	try {
		table = convertTableName(table);

		let query = `SELECT COUNT(*) as total FROM ${table}`;
		let whereClauses = [];
		let values = [];

		if (conditions && typeof conditions === "object" && Object.keys(conditions).length > 0) {
			whereClauses = Object.keys(conditions).map((key) => `${key} = ?`);
			values.push(...Object.keys(conditions).map((key) => conditions[key]));
		}

		const { search } = options || {};

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
		table1 = convertTableName(table1);
		table2 = convertTableName(table2);

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
				if (typeof value === "object") {
					// Handle operators like IN, LIKE, etc.
					const [operator, operand] = Object.entries(value)[0];
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

const clearAndInsertBulk = (table, dataArray) => {
	try {
		table = convertTableName(table);

		const transaction = db.transaction(() => {
			destroyTableData(table);

			for (const data of dataArray) {
				upsertIntoTable(table, data);
			}
		});

		transaction();
		console.log(`Successfully cleared and inserted ${dataArray.length} records into ${table}`);
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
