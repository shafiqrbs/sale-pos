import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedSettingsApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getDropdownData: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.SETTINGS,
					method: "GET",
					params,
				};
			},
			providesTags: (result, error, params) => {
				const dropdownType = params?.["dropdown-type"] || "unknown";
				if (dropdownType) {
					return [{ type: "Settings", id: dropdownType }];
				}
				return ["Settings"];
			},
		}),
		getInventorySettings: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.INVENTORY_SETTINGS,
					method: "GET",
					params,
				};
			},
			providesTags: (result, error, params) => {
				const dropdownType = params?.["dropdown-type"] || "unknown";
				if (dropdownType) {
					return [{ type: "InventorySettings", id: dropdownType }];
				}
				return ["InventorySettings"];
			},
		}),
	}),
});

export const { useGetDropdownDataQuery, useGetInventorySettingsQuery } = extendedSettingsApiSlice;
