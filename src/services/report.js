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
      providesTags: ["Sales"],
    }),
  }),
});

export const { useGetDailySummaryQuery } = extendedReportApiSlice;
