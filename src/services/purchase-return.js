import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedPurchaseReturnApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseReturn: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.PURCHASE_RETURN,
          method: "GET",
          params,
        };
      },
      providesTags: [ "PurchaseReturn" ]
    }),

    addPurchaseReturn: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.PURCHASE_RETURN,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "PurchaseReturn" ],
    }),

    updatePurchaseReturn: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.PURCHASE_RETURN,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ "PurchaseReturn" ],
    }),

    deletePurchaseReturn: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.PURCHASE_RETURN,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ "PurchaseReturn" ],
    }),

    getPurchaseReturnById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.PURCHASE_RETURN}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "PurchaseReturn" ],
    }),

    approvePurchaseReturn: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.PURCHASE_RETURN}/${id}/approve/purchase`,
          method: "GET",
        };
      },
      invalidatesTags: [ "PurchaseReturn" ],
    }),

    getVendorWisePurchaseItems: builder.query({
      query: () => {
        return {
          url: `${APP_APIS.PURCHASE_RETURN}/vendor-wise-purchase-item`,
          method: "GET",
        };
      },
      providesTags: [ "PurchaseReturn" ],
    }),

  }),
});

export const {
  useGetPurchaseReturnQuery,
  useAddPurchaseReturnMutation,
  useUpdatePurchaseReturnMutation,
  useDeletePurchaseReturnMutation,
  useGetPurchaseReturnByIdQuery,
  useApprovePurchaseReturnMutation,
  useCopyPurchaseReturnMutation,
  useGetVendorWisePurchaseItemsQuery,
} = extendedPurchaseReturnApiSlice;
