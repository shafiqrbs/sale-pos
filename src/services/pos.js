import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedPosApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        syncPos: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.SYNC_POS,
                    method: "POST",
                    body,
                };
            },
        }),
        getCategories: builder.query({
            query: () => {
                return {
                    url: APP_APIS.CATEGORIES,
                    method: "GET",
                };
            },
            providesTags: [ "Categories" ],
        }),
        getInvoiceMode: builder.query({
            query: () => {
                return {
                    url: APP_APIS.INVOICE_MODE,
                    method: "GET",
                };
            },
            providesTags: [ "InvoiceMode" ],
        }),
        getInvoiceDetails: builder.query({
            query: (params) => {
                return {
                    url: APP_APIS.INVOICE_DETAILS,
                    method: "GET",
                    params: {
                        invoice_id: params.invoice_id,
                    },
                };
            },
        }),
        inlineUpdate: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.INLINE_UPDATE,
                    method: "POST",
                    body,
                };
            },
        }),
        salesComplete: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.SALES_COMPLETE,
                    method: "POST",
                    body,
                };
            },
        }),
    }),
});

export const {
    useSyncPosMutation,
    useGetCategoriesQuery,
    useGetInvoiceModeQuery,
    useGetInvoiceDetailsQuery,
    useInlineUpdateMutation,
    useSalesCompleteMutation,
} = extendedPosApiSlice;