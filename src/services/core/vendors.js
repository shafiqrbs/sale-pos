import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedVendorsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getVendors: builder.query({
            query: () => {
                return {
                    url: APP_APIS.VENDORS,
                    method: "GET",
                };
            },
            providesTags: [ "Vendors" ],
        }),
    }),
});

export const {
    useGetVendorsQuery
} = extendedVendorsApiSlice;
