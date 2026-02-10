import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedCustomerApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getCustomers: builder.query({
			query: (params) => {
				return {
					url: APP_APIS.CUSTOMERS,
					method: "GET",
					params,
				};
			},
			providesTags: ["Customers"],
		}),

		getCustomerById: builder.query({
			query: (id) => {
				return {
					url: `${APP_APIS.CUSTOMERS}/${id}`,
					method: "GET",
				};
			},
			providesTags: ["Customers"],
		}),

		createCustomer: builder.mutation({
			query: (customer) => {
				return {
					url: APP_APIS.CUSTOMERS,
					method: "POST",
					body: customer,
				};
			},
			invalidatesTags: ["Customers"],
		}),

		updateCustomer: builder.mutation({
			query: (customer) => {
				return {
					url: `${APP_APIS.CUSTOMERS}/${customer.id}`,
					method: "PUT",
					body: customer,
				};
			},
			invalidatesTags: ["Customers"],
		}),

		deleteCustomer: builder.mutation({
			query: (id) => {
				return {
					url: `${APP_APIS.CUSTOMERS}/${id}`,
					method: "DELETE",
				};
			},
			invalidatesTags: ["Customers"],
		}),
	}),
});

export const {
	useGetCustomersQuery,
	useGetCustomerByIdQuery,
	useCreateCustomerMutation,
	useUpdateCustomerMutation,
	useDeleteCustomerMutation,
} = extendedCustomerApiSlice;
