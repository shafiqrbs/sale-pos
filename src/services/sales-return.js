import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedSalesReturnApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSalesReturn: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.SALES_RETURN,
          method: "GET",
          params,
        };
      },
      providesTags: [ "SalesReturn" ]
    }),

    addSalesReturn: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.SALES_RETURN,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "SalesReturn" ],
    }),

    updateSalesReturn: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.SALES_RETURN,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ "SalesReturn" ],
    }),

    deleteSalesReturn: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.SALES_RETURN,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ "SalesReturn" ],
    }),

    getSalesReturnById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.SALES_RETURN}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "SalesReturn" ],
    }),

    approveSalesReturn: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.SALES_RETURN}/approve/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "SalesReturn" ],
    }),

    copySalesReturn: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.SALES_RETURN}/copy/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "SalesReturn" ],
    }),
  }),
});

export const {
  useGetSalesReturnQuery,
  useAddSalesReturnMutation,
  useUpdateSalesReturnMutation,
  useDeleteSalesReturnMutation,
  useGetSalesReturnByIdQuery,
  useApproveSalesReturnMutation,
  useCopySalesReturnMutation,
} = extendedSalesReturnApiSlice;
