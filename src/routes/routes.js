export const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

export const MASTER_APIS = {
	SPLASH: `${BASE_URL}/core/splash-info`,
	LOGIN: `${BASE_URL}/user-login`,
};

export const APP_NAVLINKS = {
	BAKERY: "/pos/bakery",
	SALES: "/inventory/sales",
	STOCK: "/inventory/stock",
	ACTIVATE: "/activate",
	LOGIN: "/login",
	DASHBOARD: "/dashboard",
	CUSTOMERS: "/core/customers",
};

export const APP_APIS = {
	CONFIG: "/inventory/config",
	LOGIN: "/auth/login",
	REGISTER: "/auth/register",
	LOGOUT: "/auth/logout",
	RESET_PASSWORD: "/auth/reset-password",
	SYNC_POS: "/inventory/pos/data-process",
	CATEGORIES: "/inventory/select/category",
	INVOICE_MODE: "/inventory/pos/check/invoice-mode",
	INVOICE_DETAILS: "/inventory/pos/invoice-details",
	INLINE_UPDATE: "/inventory/pos/inline-update",
	SALES_COMPLETE: "/inventory/pos/sales-complete",
	SALES: "/inventory/sales",
	CUSTOMERS: "/core/customer",
	SETTINGS: "/core/select/setting",
};
