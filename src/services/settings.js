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
				const dropdownType = params?.[ "dropdown-type" ] || "unknown";
				if (dropdownType) {
					return [ { type: "Settings", id: dropdownType } ];
				}
				return [ "Settings" ];
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
				const dropdownType = params?.[ "dropdown-type" ] || "unknown";
				if (dropdownType) {
					return [ { type: "InventorySettings", id: dropdownType } ];
				}
				return [ "InventorySettings" ];
			},
		}),

		getInventoryCategory: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.INVENTORY_CATEGORIES,
					method: "GET",
					params,
				};
			},

			providesTags: (result, error, params) => {
				const dropdownType = params?.type || "unknown";
				if (dropdownType) {
					return [ { type: "InventoryCategory", id: dropdownType } ];
				}
				return [ "InventoryCategory" ];
			},
		}),

		getInventoryParticular: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.INVENTORY_PARTICULAR,
					method: "GET",
					params,
				};
			},

			providesTags: (result, error, params) => {
				const dropdownType = params?.[ "dropdown-type" ] || "unknown";
				if (dropdownType) {
					return [ { type: "InventoryParticular", id: dropdownType } ];
				}
				return [ "InventoryParticular" ];
			},
		}),
	}),
});

export const { useGetDropdownDataQuery, useGetInventorySettingsQuery, useGetInventoryCategoryQuery, useGetInventoryParticularQuery } = extendedSettingsApiSlice;
