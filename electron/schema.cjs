const { db } = require("./connection.cjs");

const initSchema = () => {
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
			username TEXT NOT NULL,
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
			product_id INTEGER,
			product_name TEXT NOT NULL,
			name TEXT NOT NULL,
			product_nature TEXT,
			display_name TEXT NOT NULL,
			purchase_item_for_sales TEXT DEFAULT '[]',
			measurements TEXT DEFAULT '[]',
			slug TEXT NOT NULL,
			category_id INTEGER,
			category TEXT,
			unit_id INTEGER,
			quantity REAL DEFAULT 0,
			total_sales REAL DEFAULT 0,
			average_price REAL DEFAULT 0,
			purchase_price REAL NOT NULL,
			sales_price REAL NOT NULL,
			barcode TEXT,
			unit_name TEXT,
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
			password TEXT NOT NULL,
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
			due REAL DEFAULT 0,
			approved_by_id INTEGER,
			vendor_id INTEGER,
			vendor_name TEXT,
			createdByUser TEXT,
			createdByName TEXT,
			createdById INTEGER,
			process TEXT,
			mode_name TEXT,
			purchase_mode TEXT CHECK(purchase_mode IN ('manual', 'invoice')) DEFAULT 'manual',
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
			type TEXT CHECK(type IN ('purchase', 'invoice_purchase', 'purchase_return', 'requisition')) DEFAULT 'purchase',
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
};

module.exports = { initSchema };
