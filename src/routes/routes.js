export const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;

export const MASTER_APIS = {
    SPLASH: `${BASE_URL}/core/splash-info`,
    LOGIN: `${BASE_URL}/user-login`,
}

export const APP_NAVLINKS = {
    BAKERY: "/pos/bakery",
    ACTIVATE: "/activate",
    LOGIN: "/login",
}

export const APP_APIS = {
    CONFIG: "/inventory/config",
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    RESET_PASSWORD: "/auth/reset-password",
    SYNC_POS: "/inventory/pos/data-process"
}