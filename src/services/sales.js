import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedSalesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSales: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.SALES,
          method: "GET",
          params,
        };
      },
      providesTags: [ "Sales" ],
    }),

    addSales: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.SALES,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "Sales" ],
    }),

    updateSales: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.SALES,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ "Sales" ],
    }),

    deleteSales: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.SALES,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ "Sales" ],
    }),

    getSalesById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.SALES}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "Sales" ],
    }),
  }),
});

export const { useGetSalesQuery, useAddSalesMutation, useUpdateSalesMutation, useDeleteSalesMutation, useGetSalesByIdQuery } = extendedSalesApiSlice;