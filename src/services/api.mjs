import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({
		baseUrl: import.meta.env.VITE_API_GATEWAY_URL,

		prepareHeaders: async (headers) => {
			headers.set("Accept", "application/json");
			headers.set("Content-Type", "application/json");
			headers.set("X-Api-Key", import.meta.env.VITE_API_KEY);

			try {
				const user = await window.dbAPI.getDataFromTable("users");
				if (user?.id) {
					headers.set("X-Api-User", user.id);
				}
			} catch (err) {
				console.error("Error getting user data", err);
			}

			return headers;
		},
	}),
	tagTypes: [
		"User",
		"Product",
		"Sales",
		"Purchase",
		"POS",
		"Core",
		"Categories",
		"InvoiceMode",
		"Settings",
	],
	endpoints: () => ({}),
});
