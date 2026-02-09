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

        // =============== customers endpoints ===============
        getCustomers: builder.query({
            query: (params) => {
                return {
                    url: APP_APIS.CUSTOMERS,
                    method: "GET",
                    params
                };
            },
            providesTags: [ "Customers" ],
        }),

        createCustomer: builder.mutation({
            query: (customer) => {
                return {
                    url: APP_APIS.CUSTOMERS,
                    method: "POST",
                    body: customer,
                };
            },
            invalidatesTags: [ "Customers" ],
        }),

        updateCustomer: builder.mutation({
            query: (customer) => {
                return {
                    url: `${APP_APIS.CUSTOMERS}/${customer.id}`,
                    method: "PUT",
                    body: customer,
                };
            },
            invalidatesTags: [ "Customers" ],
        }),

        deleteCustomer: builder.mutation({
            query: (id) => {
                return {
                    url: `${APP_APIS.CUSTOMERS}/${id}`,
                    method: "DELETE",
                };
            },
            invalidatesTags: [ "Customers" ],
        }),
        // =============== customers endpoints end ===============
    }),
});

export const {
    useGetConfigQuery,
    useGetCustomersQuery,
    useCreateCustomerMutation,
    useUpdateCustomerMutation,
    useDeleteCustomerMutation,
} = extendedCoreApiSlice;