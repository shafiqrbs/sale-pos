export const formatDate = (date) => {
	if (!date) return "";
	if (typeof date === "string") {
		date = new Date(date);
	}

	const formattedDate = new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
	const formattedDateWithDash = formattedDate.replace(/\//g, "-");
	return formattedDateWithDash; // 13-04-2025
};

export const formatDateTime = (date) => {
	const formattedDate = new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(date);
	const formattedDateWithDash = formattedDate.replace(/\//g, "-");
	return formattedDateWithDash; // 13-04-2025 12:00 PM
};

export const generateInvoiceId = () => {
	return Date.now().toString().slice(1, 13);
};

export const applyDiscount = (price, discount) => {
	return price - (price * discount) / 100;
};

export const applyZakat = (price, zakat) => {
	return price * zakat;
};

export const applyAIT = (price, ait) => {
	return price * ait;
};

export const applyCoupon = (price, coupon) => {
	return price - (price * coupon) / 100;
};

// =============== vat calculation utility function ================
export const calculateVATPrice = (price, vatConfig) => {
	if (!vatConfig?.vat_enable) return price;

	if (vatConfig?.vat_mode?.toLowerCase() === "including") {
		// If VAT is already included, return the price as is
		return price;
	} else if (vatConfig?.vat_mode?.toLowerCase() === "excluding") {
		// If VAT is excluded, add VAT percentage
		const vatAmount = price * (vatConfig.vat_percent / 100);
		return price + vatAmount;
	}

	return price;
};

// =============== calculate subtotal with vat ================
export const calculateSubTotalWithVAT = (price, quantity, vatConfig) => {
	const vatPrice = calculateVATPrice(price, vatConfig);
	return vatPrice * quantity;
};

export const calculateVATAmount = (vatPrice, vatConfig) => {
	if (vatConfig?.vat_mode?.toLowerCase() === "excluding") {
		// =============== calculate base price first by removing vat ================
		const basePrice = vatPrice / (1 + vatConfig.vat_percent / 100);
		// =============== then calculate vat amount from base price ================
		const vatAmount = basePrice * (vatConfig.vat_percent / 100);
		return vatAmount?.toFixed(2);
	}

	return vatPrice?.toFixed(2);
};

export const withInvoiceId = (tableId) => (tableId ? { invoice_id: tableId } : {});

export const generateSlug = (name) => {
	if (!name) return '';

	const slugName = name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');

	return `${slugName}-${Date.now().toString()}`;
};

export const generateUniqueId = () => {
	if (typeof crypto?.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return (
		Date.now().toString(36) +
		"-" +
		Math.random().toString(36).slice(2, 10)
	);
};

// =============== local storage sync records utilities ================
const LOCAL_STORAGE_SYNC_RECORDS_KEY = "sale-pos:sync-records:v1";

const safeJsonParse = (value) => {
	if (!value) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

export const getSyncRecordsFromLocalStorage = () => {
	if (typeof window === "undefined" || !window?.localStorage) return [];

	const rawValue = window.localStorage.getItem(LOCAL_STORAGE_SYNC_RECORDS_KEY);
	const parsedValue = safeJsonParse(rawValue);

	if (!Array.isArray(parsedValue)) return [];
	return parsedValue
		.filter((record) => record && typeof record === "object")
		.filter((record) => typeof record?.mode === "string" && typeof record?.syncedAt === "string");
};

export const saveSyncRecordToLocalStorage = (syncRecord) => {
	if (typeof window === "undefined" || !window?.localStorage) return [];

	const existingRecords = getSyncRecordsFromLocalStorage();
	const nextRecords = [ syncRecord, ...existingRecords ].slice(0, 200);

	window.localStorage.setItem(LOCAL_STORAGE_SYNC_RECORDS_KEY, JSON.stringify(nextRecords));
	return nextRecords;
};

export const getLastSyncRecord = (syncRecords) => {
	if (!Array.isArray(syncRecords) || syncRecords.length === 0) return null;
	return syncRecords[0] ?? null;
};

export const getLastSyncRecordByMode = (syncRecords, mode) => {
	if (!Array.isArray(syncRecords) || !mode) return null;
	return syncRecords.find((record) => record?.mode === mode) ?? null;
};

// =============== public folder asset path: use ./ in built Electron app, absolute URL in browser so it works after full-page redirect ===============
export const getPublicAssetPath = (filename) => {
	if (typeof window === "undefined") return `./${filename}`;
	const isElectron = typeof window.dbAPI !== "undefined";
	if (isElectron) return `./${filename}`;
	return `${window.location.origin}/${filename}`;
};
