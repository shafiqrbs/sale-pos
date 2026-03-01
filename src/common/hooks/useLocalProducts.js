import { useState, useCallback, useEffect } from "react";

/**
 * =============== custom hook for fetching products from local database ================
 * @param {Object} options - configuration options
 * @param {boolean} options.fetchOnMount - whether to fetch immediately on mount (default: true)
 * @param {Object} options.condition - initial filter condition
 * @param {string} options.orderBy - initial order by field
 * @param {Object} options.queryOptions - initial query options
 * @returns {Object} { products, getLocalProducts, getProduct, refetch, loading, error }
 */
export default function useLocalProducts(options = {}) {
	const {
		fetchOnMount = true,
		condition: initialCondition = {},
		orderBy: initialOrderBy = "id",
		queryOptions: initialQueryOptions = {},
	} = options;

	const [ products, setProducts ] = useState([]);
	const [ totalCount, setTotalCount ] = useState(0);
	const [ loading, setLoading ] = useState(false);
	const [ error, setError ] = useState(null);
	const [ lastFetchParams, setLastFetchParams ] = useState(null);

	/**
	 * =============== fetch products from local database with filters and pagination ================
	 * @param {Object} condition - filter condition (e.g., { stock_id: 123 })
	 * @param {string} orderBy - field to order by (default: "id")
	 * @param {Object} queryOptions - query options including:
	 *   - limit: number of items per page
	 *   - offset: starting position
	 *   - search: { like: { field: value }, in: { field: [values] } }
	 * @returns {Promise<Array>} fetched products
	 */
	const getLocalProducts = useCallback(async (condition = {}, orderBy = "id", queryOptions = {}) => {
		setLoading(true);
		setError(null);
		setLastFetchParams({ condition, orderBy, queryOptions });

		try {
			const fetchedProducts = await window.dbAPI.getDataFromTable(
				"core_products",
				condition,
				orderBy,
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
	}, []);

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

		const { condition, orderBy, queryOptions } = lastFetchParams;
		return getLocalProducts(condition, orderBy, queryOptions);
	}, [ lastFetchParams, getLocalProducts ]);

	// =============== auto-fetch on mount if enabled ================
	useEffect(() => {
		if (fetchOnMount) {
			getLocalProducts(initialCondition, initialOrderBy, initialQueryOptions);
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
		loading,
		error,
	};
}
