import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedCorePurchaseApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		updatePurchaseConfig: builder.mutation({
			query: (body) => {
				return {
					url: `${APP_APIS.PURCHASE_CONFIG}/${body.domain_id}`,
					method: "POST",
					body,
				};
			},
			invalidatesTags: ["Core"],
		}),
	}),
});

export const { useUpdatePurchaseConfigMutation } = extendedCorePurchaseApiSlice;
