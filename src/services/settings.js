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
			providesTags: [ "Settings" ],
		}),
	}),
});

export const { useGetDropdownDataQuery } = extendedSettingsApiSlice;
