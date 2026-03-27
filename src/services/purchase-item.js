import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedPurchaseItemApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseItem: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.PURCHASE_ITEM,
          method: "GET",
          params,
        };
      },
      providesTags: [ "PurchaseItem" ]
    }),

    getPurchaseItemById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.PURCHASE_ITEM}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "PurchaseItem" ],
    }),

  }),
});

export const {
    useGetPurchaseItemQuery,
	useGetPurchaseItemByIdQuery,
} = extendedPurchaseItemApiSlice;
