import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedParticularApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getParticulars: builder.query({
			query: (params) => ({
				url: APP_APIS.PARTICULAR,
				method: "GET",
				params,
			}),
			providesTags: ["Particulars"],
		}),

		getParticularById: builder.query({
			query: (id) => ({
				url: `${APP_APIS.PARTICULAR}/${id}`,
				method: "GET",
			}),
			providesTags: ["Particulars"],
		}),

		getParticularTypes: builder.query({
			query: () => ({
				url: APP_APIS.PARTICULAR_TYPES,
				method: "GET",
			}),
			providesTags: ["Particulars"],
		}),

		createParticular: builder.mutation({
			query: (particular) => ({
				url: APP_APIS.PARTICULAR,
				method: "POST",
				body: particular,
			}),
			invalidatesTags: (result, error) => (error ? [] : ["Particulars"]),
		}),

		updateParticular: builder.mutation({
			query: (particular) => ({
				url: `${APP_APIS.PARTICULAR}/${particular.id}`,
				method: "PATCH",
				body: particular,
			}),
			invalidatesTags: (result, error) => (error ? [] : ["Particulars"]),
		}),

		deleteParticular: builder.mutation({
			query: (id) => ({
				url: `${APP_APIS.PARTICULAR}/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: (result, error) => (error ? [] : ["Particulars"]),
		}),
	}),
});

export const {
	useGetParticularsQuery,
	useGetParticularByIdQuery,
	useGetParticularTypesQuery,
	useCreateParticularMutation,
	useUpdateParticularMutation,
	useDeleteParticularMutation,
} = extendedParticularApiSlice;
