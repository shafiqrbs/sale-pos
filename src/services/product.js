import { apiSlice } from "@services/api.mjs";
import { APP_APIS } from "@/routes/routes";

export const extendedProductApiSlice = apiSlice.injectEndpoints({
	endpoints: (builder) => ({
		getProduct: builder.query({
			query: (params = {}) => {
				return {
					url: APP_APIS.POS_PRODUCT,
					method: "GET",
					params,
				};
			},

			providesTags: ["Product"],
		}),

		getProductById: builder.query({
			query: (id) => {
				return {
					url: `${APP_APIS.INVENTORY_PRODUCT}/${id}`,
					method: "GET",
				};
			},

			providesTags: (result, error, id) => [{ type: "Product", id }],
		}),

		addProduct: builder.mutation({
			query: (body) => {
				return {
					url: APP_APIS.INVENTORY_PRODUCT,
					method: "POST",
					body,
				};
			},

			invalidatesTags: ["Product"],
		}),

		updateProduct: builder.mutation({
			query: ({ id, body }) => {
				return {
					url: `${APP_APIS.INVENTORY_PRODUCT}/${id}`,
					method: "PATCH",
					body,
				};
			},

			invalidatesTags: (result, error, { id }) => [
				{ type: "Product", id },
				"Product",
			],
		}),

		getProductSkus: builder.query({
			query: (productId) => {
				return {
					url: `${APP_APIS.INVENTORY_PRODUCT}/stock/sku/${productId}`,
					method: "GET",
				};
			},

			providesTags: (result, error, productId) => [
				{ type: "Product", id: `SKU-LIST-${productId}` },
			],
		}),

		addProductSku: builder.mutation({
			query: (body) => {
				return {
					url: `${APP_APIS.INVENTORY_PRODUCT}/stock/sku`,
					method: "POST",
					body,
				};
			},

			invalidatesTags: (result, error, body) => [
				{ type: "Product", id: `SKU-LIST-${body?.product_id}` },
				"Product",
			],
		}),

		inlineUpdateProductSku: builder.mutation({
			query: ({ skuId, body }) => {
				return {
					url: `${APP_APIS.INVENTORY_PRODUCT}/stock/sku/inline-update/${skuId}`,
					method: "POST",
					body,
				};
			},

			invalidatesTags: ["Product"],
		}),

		uploadProductGalleryImage: builder.mutation({
			query: (formData) => ({
				url: `${APP_APIS.INVENTORY_PRODUCT}/gallery`,
				method: "POST",
				body: formData,
				headers: { "X-Multipart-Form": "1" },
			}),
			invalidatesTags: ["Product"],
		}),

		deleteProductGalleryImage: builder.mutation({
			query: (formData) => ({
				url: `${APP_APIS.INVENTORY_PRODUCT}/gallery/delete`,
				method: "POST",
				body: formData,
				headers: { "X-Multipart-Form": "1" },
			}),
			invalidatesTags: ["Product"],
		}),
	}),
});

export const {
	useGetProductQuery,
	useLazyGetProductQuery,
	useGetProductByIdQuery,
	useAddProductMutation,
	useUpdateProductMutation,
	useGetProductSkusQuery,
	useLazyGetProductSkusQuery,
	useAddProductSkuMutation,
	useInlineUpdateProductSkuMutation,
	useUploadProductGalleryImageMutation,
	useDeleteProductGalleryImageMutation,
} = extendedProductApiSlice;
