const { db, close } = require("./connection.cjs");
const {
	VALID_SQL_OPERATORS,
	validateTableName,
	validateIdentifier,
	validateSearchFields,
} = require("./validators.cjs");

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

			if (search.gt && typeof search.gt === "object") {
				for (const [field, value] of Object.entries(search.gt)) {
					if (value !== undefined && value !== null && value !== "") {
						conditions.push(`${field} > ?`);
						values.push(value);
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

			if (search.gt && typeof search.gt === "object") {
				for (const [field, value] of Object.entries(search.gt)) {
					if (value !== undefined && value !== null && value !== "") {
						whereClauses.push(`${field} > ?`);
						values.push(value);
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
