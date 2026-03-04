import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedVendorsApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getLocalStorageVendors: builder.query({
			query: () => {
				return {
					url: APP_APIS.LOCAL_STORAGE_VENDORS,
					method: "GET",
				};
			},
			providesTags: ["LocalStorageVendors"],
		}),
		getVendors: builder.query({
			query: () => {
				return {
					url: APP_APIS.VENDORS,
					method: "GET",
				};
			},
			providesTags: ["Vendors"],
		}),
		addVendor: builder.mutation({
			query: (body) => {
				return {
					url: APP_APIS.VENDORS,
					method: "POST",
					body,
				};
			},
			invalidatesTags: ["Vendors"],
		}),
	}),
});

export const { useGetLocalStorageVendorsQuery, useGetVendorsQuery, useAddVendorMutation } =
	extendedVendorsApiSlice;
