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
            }
        }),
        getCategories: builder.query({
            query: () => {
                return {
                    url: APP_APIS.CATEGORIES,
                    method: "GET",
                };
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        { type: "Categories", id: "LIST" },
                        ...result.data.map((category) => ({
                            type: "Categories",
                            id: category.id,
                        })),
                    ]
                    : [ { type: "Categories", id: "LIST" } ],
        }),
        getInvoiceMode: builder.query({
            query: () => {
                return {
                    url: APP_APIS.INVOICE_MODE,
                    method: "GET",
                };
            },
            providesTags: (result) =>
                result?.data
                    ? [
                        { type: "InvoiceMode", id: "LIST" },
                        ...result.data.map((mode) => ({
                            type: "InvoiceMode",
                            id: mode.id,
                        })),
                    ]
                    : [ { type: "InvoiceMode", id: "LIST" } ],
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
            providesTags: (result, error, params) => [
                { type: "Sales", id: params.invoice_id },
            ],
        }),
        inlineUpdate: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.INLINE_UPDATE,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: (result, error, body) => [
                { type: "Sales", id: body.invoice_id },
            ],
        }),
        salesComplete: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.SALES_COMPLETE,
                    method: "POST",
                    body,
                };
            },
            invalidatesTags: (result, error, body) => [
                { type: "Sales", id: body.invoice_id },
                { type: "Sales", id: "LIST" },
            ],
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