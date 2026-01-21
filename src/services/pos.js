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
            providesTags: [ "POS" ],
        }),
    }),
});

export const {
    useSyncPosMutation
} = extendedPosApiSlice;