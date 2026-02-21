import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedPurchaseApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPurchase: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.PURCHASE,
          method: "GET",
          params,
        };
      },
      providesTags: [ "Purchase" ]
    }),

    addPurchase: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.PURCHASE,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "Purchase" ],
    }),

    updatePurchase: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.PURCHASE,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ "Purchase" ],
    }),

    deletePurchase: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.PURCHASE,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ "Purchase" ],
    }),

    getPurchaseById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.PURCHASE}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "Purchase" ],
    }),

    approvePurchase: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.PURCHASE}/approve/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "Purchase" ],
    }),

    copyPurchase: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.PURCHASE}/copy/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "Purchase" ],
    }),
  }),
});

export const {
  useGetPurchaseQuery,
  useAddPurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useGetPurchaseByIdQuery,
  useApprovePurchaseMutation,
  useCopyPurchaseMutation,
} = extendedPurchaseApiSlice;