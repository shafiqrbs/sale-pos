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
      providesTags: (result) =>
        result?.data
          ? [
            { type: "Sales", id: "LIST" },
            ...result.data.map((sale) => ({
              type: "Sales",
              id: sale.invoice,
            })),
          ]
          : [ { type: "Sales", id: "LIST" } ],
    }),

    addSales: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.SALES,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ { type: "Sales", id: "LIST" } ],
    }),

    updateSales: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.SALES,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: (result, error, body) => [
        { type: "Sales", id: body.invoice },
        { type: "Sales", id: "LIST" },
      ],
    }),

    deleteSales: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.SALES,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ { type: "Sales", id: "LIST" } ],
    }),

    getSalesById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.SALES}/${id}`,
          method: "GET",
        };
      },
      providesTags: (result, error, id) => [ { type: "Sales", id } ],
    }),
  }),
});

export const { useGetSalesQuery, useAddSalesMutation, useUpdateSalesMutation, useDeleteSalesMutation, useGetSalesByIdQuery } = extendedSalesApiSlice;