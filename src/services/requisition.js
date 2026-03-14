import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedRequisitionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRequisition: builder.query({
      query: (params) => {
        return {
          url: APP_APIS.REQUISITION,
          method: "GET",
          params,
        };
      },
      providesTags: [ "Requisition" ]
    }),

    addRequisition: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.REQUISITION,
          method: "POST",
          body,
        };
      },
      invalidatesTags: [ "Requisition" ],
    }),

    updateRequisition: builder.mutation({
      query: (body) => {
        return {
          url: APP_APIS.REQUISITION,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [ "Requisition" ],
    }),

    deleteRequisition: builder.mutation({
      query: (id) => {
        return {
          url: APP_APIS.REQUISITION,
          method: "DELETE",
          id,
        };
      },
      invalidatesTags: [ "Requisition" ],
    }),

    getRequisitionById: builder.query({
      query: (id) => {
        return {
          url: `${APP_APIS.REQUISITION}/${id}`,
          method: "GET",
        };
      },
      providesTags: [ "Requisition" ],
    }),

    approveRequisition: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.REQUISITION}/approve/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "Requisition" ],
    }),

    copyRequisition: builder.mutation({
      query: (id) => {
        return {
          url: `${APP_APIS.REQUISITION}/copy/${id}`,
          method: "GET",
        };
      },
      invalidatesTags: [ "Requisition" ],
    }),
  }),
});

export const {
  useGetRequisitionQuery,
  useAddRequisitionMutation,
  useUpdateRequisitionMutation,
  useDeleteRequisitionMutation,
  useGetRequisitionByIdQuery,
  useApproveRequisitionMutation,
  useCopyRequisitionMutation,
} = extendedRequisitionApiSlice;
