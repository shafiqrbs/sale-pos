import { useState, useCallback, useEffect } from "react";
import { useLazyGetProductQuery } from "@services/product";

/**
 * =============== map a single api product response to the core_products local schema ================
 * the api uses different field names than the sqlite table, so we translate them here
 * before bulk-inserting so that not-null constraints are satisfied.
 */
const mapApiProductToLocalSchema = (apiProduct) => ({
	id: apiProduct.id,
	stock_id: apiProduct.id,
	product_name: apiProduct.product_name ?? "",
	name: apiProduct.product_name ?? "",
	display_name: apiProduct.product_name ?? "",
	product_nature: apiProduct.product_type ?? "",
	slug: apiProduct.slug ?? "",
	unit_name: apiProduct.unit_name ?? "",
	unit_id: 0,
	category: apiProduct.category_name || apiProduct.category || "",
	quantity: apiProduct.quantity ?? 0,
	purchase_price: apiProduct.purchase_price ?? 0,
	sales_price: apiProduct.sales_price ?? 0,
	average_price: apiProduct.average_price ?? 0,
	barcode: apiProduct.barcode ?? null,
	feature_image: apiProduct.images ?? null,
	measurements: JSON.stringify(apiProduct.measurements || []),
	purchase_item_for_sales: JSON.stringify(apiProduct.purchase_item_for_sales || []),
});

const normalizeCondition = (condition) => {
	return Object.entries(condition).reduce((acc, [ key, value ]) => {
		if (value !== null && value !== undefined) {
			acc[ key ] = value;
		}
		return acc;
	}, {});
};

/**
 * =============== custom hook for fetching products from local database ================
 * @param {Object} options - configuration options
 * @param {boolean} options.fetchOnMount - whether to fetch immediately on mount (default: true)
 * @param {Object} options.condition - initial filter condition
 * @param {string} options.propertyId - initial property id field
 * @param {Object} options.queryOptions - initial query options
 * @returns {Object} { products, getLocalProducts, getProduct, refetch, loading, error }
 */
export default function useLocalProducts(options = {}) {
	const {
		fetchOnMount = true,
		condition: initialCondition = {},
		propertyId: initialPropertyId = "id",
		queryOptions: initialQueryOptions = {},
	} = options;

	const [ triggerGetProduct ] = useLazyGetProductQuery();

	const [ products, setProducts ] = useState([]);
	const [ totalCount, setTotalCount ] = useState(0);
	const [ loading, setLoading ] = useState(false);
	const [ isSyncing, setIsSyncing ] = useState(false);
	const [ error, setError ] = useState(null);
	const [ lastFetchParams, setLastFetchParams ] = useState(null);
	/**
	 * =============== fetch products from local database with filters and pagination ================
	 * @param {Object} condition - filter condition (e.g., { stock_id: 123 })
	 * @param {string} propertyId - property id field (default: "id")
	 * @param {Object} queryOptions - query options including:
	 *   - limit: number of items per page
	 *   - offset: starting position
	 *   - search: { like: { field: value }, in: { field: [values] } }
	 * @returns {Promise<Array>} fetched products
	 */
	const getLocalProducts = useCallback(
		async (condition = {}, propertyId = "id", queryOptions = {}) => {
			setLoading(true);
			setError(null);

			const normalizedCondition = normalizeCondition(condition);

			setLastFetchParams({ condition: normalizedCondition, propertyId, queryOptions });

			try {
				const fetchedProducts = await window.dbAPI.getDataFromTable(
					"core_products",
					normalizedCondition,
					propertyId,
					queryOptions
				);

				const productArray = Array.isArray(fetchedProducts) ? fetchedProducts : [];
				setProducts(productArray);
				setLoading(false);
				return productArray;
			} catch (fetchError) {
				console.error("Error fetching products from local database:", fetchError);
				setError(fetchError);
				setProducts([]);
				setLoading(false);
				return [];
			}
		},
		[]
	);

	/**
	 * =============== get total count of products matching criteria ================
	 * @param {Object} condition - filter condition
	 * @param {Object} countOptions - options including search filters
	 * @returns {Promise<number>} total count of products
	 */
	const getProductCount = useCallback(async (condition = {}, countOptions = {}) => {
		try {
			const count = await window.dbAPI.getTableCount("core_products", condition, countOptions);
			const countNumber = typeof count === "number" ? count : 0;
			setTotalCount(countNumber);
			return countNumber;
		} catch (countError) {
			console.error("Error getting product count:", countError);
			setTotalCount(0);
			return 0;
		}
	}, []);

	/**
	 * =============== fetch single product by stock id ================
	 * @param {number} stockId - product stock_id
	 * @returns {Promise<Object|null>} single product or null
	 */
	const getProduct = useCallback(async (stockId) => {
		setLoading(true);
		setError(null);

		try {
			const fetchedProducts = await window.dbAPI.getDataFromTable("core_products", {
				stock_id: stockId,
			});

			setLoading(false);

			if (fetchedProducts && fetchedProducts.length > 0) {
				return fetchedProducts[ 0 ];
			}

			return null;
		} catch (fetchError) {
			console.error("Error fetching product by stock id:", fetchError);
			setError(fetchError);
			setLoading(false);
			return null;
		}
	}, []);

	const addProduct = async (product) => {
		setLoading(true);
		setError(null);
		try {
			await window.dbAPI.upsertIntoTable("core_products", product);
		} catch (error) {
			console.error("Error adding product:", error);
			setError(error);
		} finally {
			setLoading(false);
		}
	};

	/**
	 * =============== refetch products with last used parameters ================
	 * @returns {Promise<Array>} fetched products
	 */
	const refetch = useCallback(async () => {
		if (!lastFetchParams) {
			console.warn("No previous fetch parameters available for refetch");
			return [];
		}

		const { condition, propertyId, queryOptions } = lastFetchParams;
		return getLocalProducts(condition, propertyId, queryOptions);
	}, [ lastFetchParams, getLocalProducts ]);

	/**
	 * =============== fetch all online products and repopulate core_products table in local db ================
	 * fetches every paginated page from the server, clears the local table, then bulk-inserts fresh data.
	 * safe to call from any component — put your RTK Query params in fetchParams.
	 * @param {Object} fetchParams - query params forwarded to the product api (term, type, product_nature, …)
	 * @returns {Promise<{success: boolean, count: number}>}
	 */
	const syncOnlineProductsToLocal = useCallback(async (fetchParams = {}) => {
		setIsSyncing(true);
		setError(null);

		try {
			// =============== fetch up to 500 records per request to minimize round-trips ================
			const SYNC_PAGE_SIZE = 500;

			const firstPageResponse = await triggerGetProduct(
				{ ...fetchParams, page: 1, offset: SYNC_PAGE_SIZE },
				false
			).unwrap();

			const totalProductCount = firstPageResponse.total ?? 0;
			let allProducts = Array.isArray(firstPageResponse.data) ? [ ...firstPageResponse.data ] : [];

			const totalPageCount = Math.ceil(totalProductCount / SYNC_PAGE_SIZE);

			// =============== fetch remaining pages sequentially ================
			for (let currentPage = 2; currentPage <= totalPageCount; currentPage++) {
				const pageResponse = await triggerGetProduct(
					{ ...fetchParams, page: currentPage, offset: SYNC_PAGE_SIZE },
					false
				).unwrap();

				if (Array.isArray(pageResponse?.data)) {
					allProducts = [ ...allProducts, ...pageResponse.data ];
				}
			}

			// =============== safety guard: never wipe the table if the api returned nothing ================
			if (allProducts.length === 0) {
				return { success: false, count: 0 };
			}

			// =============== translate api fields to match the local sqlite schema ================
			const mappedProducts = allProducts.map(mapApiProductToLocalSchema);

			// =============== wipe old local records and bulk-insert fresh ones ================
			await window.dbAPI.clearAndInsertBulk("core_products", mappedProducts, { batchSize: 500 });

			// =============== re-fetch the current local page so offline view is immediately up to date ================
			if (lastFetchParams) {
				const { condition, propertyId, queryOptions } = lastFetchParams;
				await getLocalProducts(condition, propertyId, queryOptions);
			}

			// =============== update total count so pagination reflects the new data ================
			await getProductCount({});

			return { success: true, count: allProducts.length };
		} catch (syncError) {
			console.error("Error syncing online products to local db:", syncError);
			setError(syncError);
			return { success: false, count: 0 };
		} finally {
			setIsSyncing(false);
		}
	}, [ triggerGetProduct, lastFetchParams, getLocalProducts, getProductCount ]);

	// =============== auto-fetch on mount if enabled ================
	useEffect(() => {
		if (fetchOnMount) {
			getLocalProducts(initialCondition, initialPropertyId, initialQueryOptions);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return {
		products,
		addProduct,
		totalCount,
		getLocalProducts,
		getProductCount,
		getProduct,
		refetch,
		syncOnlineProductsToLocal,
		loading,
		isSyncing,
		error,
	};
}
