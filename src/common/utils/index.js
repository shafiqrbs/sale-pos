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
	if (!name) return "";

	const slugName = name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, "")
		.replace(/[\s_-]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return `${slugName}-${Date.now().toString()}`;
};

export const generateUniqueId = () => {
	if (typeof crypto?.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
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
	return syncRecords[ 0 ] ?? null;
};

export const getLastSyncRecordByMode = (syncRecords, mode) => {
	if (!Array.isArray(syncRecords) || !mode) return null;
	return syncRecords.find((record) => record?.mode === mode) ?? null;
};

// =============== parses YYYY-MM-DD string (e.g. 2026-03-14) to Date object, uses noon local time to avoid timezone boundary issues (e.g. Bangladesh UTC+6) ===============
export const parseDateISO = (dateString) => {
	if (!dateString) return null;
	const trimmed = String(dateString).trim();
	const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return null;
	const [ , year, month, day ] = match.map(Number);
	const parsed = new Date(year, month - 1, day, 12, 0, 0);
	return isNaN(parsed.getTime()) ? null : parsed;
};

// =============== extracts date part only (YYYY-MM-DD) from ISO string, e.g. 2026-03-19T06:00:00.000Z → 2026-03-19 ===============
export const extractDateISO = (dateString) => {
	if (!dateString) return "";
	const trimmed = String(dateString).trim();
	const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
	return match ? match[ 1 ] : "";
};

// =============== returns YYYY-MM-DD for api query params (e.g. start_date, end_date) ===============
export const formatDateISO = (date) => {
	if (!date) return "";
	if (typeof date === "string") date = new Date(date);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
};

// =============== parses both YYYY-MM-DD and DD-MM-YYYY strings to Date ===============
export const parseDateString = (dateString) => {
	if (!dateString) return null;
	const parts = String(dateString).trim().split("-");
	if (parts.length !== 3) return null;
	const first = parts[ 0 ];
	const isISO = first.length === 4 && Number(first) > 999;
	const [ year, month, day ] = isISO
		? [ Number(parts[ 0 ]), Number(parts[ 1 ]) - 1, Number(parts[ 2 ]) ]
		: [ Number(parts[ 2 ]), Number(parts[ 1 ]) - 1, Number(parts[ 0 ]) ];
	const parsed = new Date(year, month, day);
	return isNaN(parsed.getTime()) ? null : parsed;
};

export function getRandomColor(index) {
	const colors = [
		"var(--mantine-color-blue-6)",
		"var(--mantine-color-grape-6)",
		"var(--mantine-color-violet-6)",
		"var(--mantine-color-pink-6)",
		"var(--mantine-color-red-6)",
		"var(--mantine-color-orange-6)",
		"var(--mantine-color-yellow-6)",
		"var(--mantine-color-lime-6)",
		"var(--mantine-color-green-6)",
		"var(--mantine-color-teal-6)",
		"var(--mantine-color-cyan-6)",
		"var(--mantine-color-indigo-6)",
	];
	return colors[ index % colors.length ];
}

export const formatCurrency = (amount) => {
	if (!amount || isNaN(Number(amount))) return "0.00";

	return new Intl.NumberFormat("en-BD", {
		style: "decimal",
		maximumFractionDigits: 2,
	}).format(amount);
};

export const forceBooleanToInt = (value) => (value === true || value === 1 ? 1 : 0);

export const parseJsonArray = (value) => {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

// =============== checks if expired_date string is strictly before today (start of day, local time). Accepts DD-Mon-YYYY (e.g. 10-Mar-2026), YYYY-MM-DD, and DD-MM-YYYY. Returns false for empty/unparsable values so unknown dates are not treated as expired. ===============
const MONTH_NAME_TO_INDEX = {
	jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
	jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

export const isExpiredDate = (value) => {
	if (!value) return false;
	const trimmed = String(value).trim();
	let parsed = null;

	const monMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
	if (monMatch) {
		const day = Number(monMatch[ 1 ]);
		const monthIndex = MONTH_NAME_TO_INDEX[ monMatch[ 2 ].toLowerCase() ];
		const year = Number(monMatch[ 3 ]);
		if (monthIndex !== undefined) parsed = new Date(year, monthIndex, day);
	}

	if (!parsed) {
		const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
		if (isoMatch) {
			parsed = new Date(Number(isoMatch[ 1 ]), Number(isoMatch[ 2 ]) - 1, Number(isoMatch[ 3 ]));
		}
	}

	if (!parsed) {
		const dmyMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
		if (dmyMatch) {
			parsed = new Date(Number(dmyMatch[ 3 ]), Number(dmyMatch[ 2 ]) - 1, Number(dmyMatch[ 1 ]));
		}
	}

	if (!parsed || isNaN(parsed.getTime())) return false;

	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return parsed.getTime() < today.getTime();
};

// =============== labels from t() must be escaped before embedding in nothingFoundHtml (innerHTML) ===============
export function escapeHtmlForVirtualSelectEmptyState(text) {
	if (text == null) {
		return "";
	}
	const div = document.createElement("div");
	div.textContent = String(text);
	return div.innerHTML;
}