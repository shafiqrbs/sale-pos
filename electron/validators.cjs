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

// Validates all field names in search objects (equals, like, in, gt) before they reach SQL
const validateSearchFields = (search) => {
	if (!search || typeof search !== "object") return;
	for (const group of ["equals", "like", "in", "gt"]) {
		if (search[group] && typeof search[group] === "object") {
			for (const field of Object.keys(search[group])) {
				validateIdentifier(field, "search field");
			}
		}
	}
};

module.exports = {
	VALID_TABLES,
	SAFE_IDENTIFIER,
	VALID_SQL_OPERATORS,
	validateTableName,
	validateIdentifier,
	validateSearchFields,
};
