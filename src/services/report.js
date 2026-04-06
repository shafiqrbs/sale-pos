import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedReportApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({

		getDailySummary: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.DAILY_SUMMARY,
					method: "GET",
					params,
				};
			},
			providesTags: [ "Reports" ],
		}),

		getCategorySummary: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.CATEGORY_SUMMARY,
					method: "GET"
				};
			},
			providesTags: [ "Reports" ],
		}),

		getDamageItem: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.DAMAGE_ITEM,
					method: "GET",
					params,
				};
			},
			providesTags: [ "Reports" ],
		}),
	}),
});

export const {
	useGetDailySummaryQuery,
	useGetCategorySummaryQuery,
	useGetDamageItemQuery,
} = extendedReportApiSlice;
