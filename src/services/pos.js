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
            invalidatesTags: (result, error, params) => {
                switch (params.syncType) {
                    case "sales":
                        return [ "Sales" ];
                    case "purchases":
                        return [ "Purchases" ];
                    case "products":
                        return [ "Products" ];
                }
            }
        }),
        getCategories: builder.query({
            query: () => {
                return {
                    url: APP_APIS.CATEGORIES,
                    method: "GET",
                };
            },
            providesTags: [ "Categories" ]
        }),
        getInvoiceMode: builder.query({
            query: () => {
                return {
                    url: APP_APIS.INVOICE_MODE,
                    method: "GET",
                };
            },
            providesTags: [ "InvoiceMode" ]
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
            providesTags: [ "Sales" ]
        }),
        inlineUpdate: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.INLINE_UPDATE,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: [ "Sales" ]
        }),
        salesComplete: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.SALES_COMPLETE,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: [ "Sales" ]
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