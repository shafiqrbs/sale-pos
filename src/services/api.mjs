import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_GATEWAY_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

export const apiSlice = createApi({
	reducerPath: "api",
	baseQuery: fetchBaseQuery({
		baseUrl: BASE_URL,

		prepareHeaders: async (headers) => {
			headers.set("Accept", "application/json");
			headers.set("Content-Type", "application/json");
			headers.set("X-Api-Key", API_KEY);

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
		"Customers",
		"Vendors",
		"Requisition",
		"PurchaseReturn",
		"PurchaseItem",
		"SalesReturn",
		"Reports",
		"LocalStorageVendors",
	],
	endpoints: () => ({}),
});

export const getDataWithoutStore = async ({ url, params }) => {
	try {
		const user = await window.dbAPI.getDataFromTable("users");
		const userId = user ? user.id : null;

		const response = await axios(`${BASE_URL}/${url}`, {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-Api-Key": API_KEY,
				"X-Api-User": userId,
			},
			params,
		});
		return response.data;
	} catch (error) {
		console.error("Error getting data without store", error);
		return null;
	}
};
