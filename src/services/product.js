import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedProductApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getProduct: builder.query({
            query: (params = {}) => {
                return {
                    url: APP_APIS.INVENTORY_PRODUCT,
                    method: "GET",
                    params,
                };
            },

            providesTags: [ "Product" ]
        }),

        addProduct: builder.mutation({
            query: (body) => {
                return {
                    url: APP_APIS.INVENTORY_PRODUCT,
                    method: "POST",
                    body,
                };
            },

            invalidatesTags: [ "Product" ]
        }),
    }),
});

export const { useGetProductQuery, useAddProductMutation } = extendedProductApiSlice;