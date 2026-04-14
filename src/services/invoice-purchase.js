import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedInvoicePurchaseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvoicePurchase: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.INVOICE_PURCHASE,
          method: "GET",
          params,
        };
      },
      providesTags: [ "InvoicePurchase" ]
    }),

    addInvoicePurchase: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.INVOICE_PURCHASE,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "InvoicePurchase", "Purchase" ],
    }),

    updateInvoicePurchase: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.INVOICE_PURCHASE,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ "InvoicePurchase", "Purchase" ],
    }),

    deleteInvoicePurchase: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.INVOICE_PURCHASE,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ "InvoicePurchase", "Purchase" ],
    }),

    getInvoicePurchaseById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.INVOICE_PURCHASE}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "InvoicePurchase" ],
    }),

    approveInvoicePurchase: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.INVOICE_PURCHASE}/approve/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "InvoicePurchase", "Purchase" ],
    }),

    copyInvoicePurchase: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.INVOICE_PURCHASE}/copy/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "InvoicePurchase", "Purchase" ],
    }),

    getItemsForDamageInvoicePurchase: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.INVOICE_PURCHASE}/items-for-damage/${id}`,
          method: "GET",
        };
      },
    }),

    processDamageInvoicePurchase: builder.mutation({
      query: ({ id, body }) => {
        return {
          url: `${APP_APIS.INVOICE_PURCHASE}/manual/damage-process/${id}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "InvoicePurchase", "Purchase" ],
    }),
  }),
});

export const {
  useGetInvoicePurchaseQuery,
  useAddInvoicePurchaseMutation,
  useUpdateInvoicePurchaseMutation,
  useDeleteInvoicePurchaseMutation,
  useGetInvoicePurchaseByIdQuery,
  useApproveInvoicePurchaseMutation,
  useCopyInvoicePurchaseMutation,
  useLazyGetItemsForDamageInvoicePurchaseQuery,
  useProcessDamageInvoicePurchaseMutation,
} = extendedInvoicePurchaseApiSlice;
