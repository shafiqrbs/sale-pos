import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedCoreApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getConfig: builder.query({
            query: () => {
                return {
                    url: APP_APIS.CONFIG,
                    method: "GET",
                };
            },
            providesTags: [ "Core" ],
        }),
    }),
});

export const {
    useGetConfigQuery
} = extendedCoreApiSlice;