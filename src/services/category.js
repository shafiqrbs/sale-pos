import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedCategoryApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getFullCategories: builder.query({
			query: (params) => ({
				url: APP_APIS.CATEGORY_GROUP,
				method: "GET",
				params: { ...params, type: "category" },
			}),
			providesTags: ["CategoryGroups"],
		}),

		getCategoryById: builder.query({
			query: (id) => ({
				url: `${APP_APIS.CATEGORY_GROUP}/${id}`,
				method: "GET",
			}),
			providesTags: ["CategoryGroups"],
		}),

		getParentCategories: builder.query({
			query: () => ({
				url: APP_APIS.PARENT_CATEGORIES,
				method: "GET",
			}),
			providesTags: ["CategoryGroups"],
		}),

		createCategory: builder.mutation({
			query: (category) => ({
				url: APP_APIS.CATEGORY_GROUP,
				method: "POST",
				body: category,
			}),
			invalidatesTags: (result, error) => (error ? [] : ["CategoryGroups"]),
		}),

		updateCategory: builder.mutation({
			query: (category) => ({
				url: `${APP_APIS.CATEGORY_GROUP}/${category.id}`,
				method: "PATCH",
				body: category,
			}),
			invalidatesTags: (result, error) => (error ? [] : ["CategoryGroups"]),
		}),

		deleteCategory: builder.mutation({
			query: (id) => ({
				url: `${APP_APIS.CATEGORY_GROUP}/${id}`,
				method: "DELETE",
			}),
			invalidatesTags: (result, error) => (error ? [] : ["CategoryGroups"]),
		}),
	}),
});

export const {
	useGetFullCategoriesQuery,
	useGetCategoryByIdQuery,
	useGetParentCategoriesQuery,
	useCreateCategoryMutation,
	useUpdateCategoryMutation,
	useDeleteCategoryMutation,
} = extendedCategoryApiSlice;
