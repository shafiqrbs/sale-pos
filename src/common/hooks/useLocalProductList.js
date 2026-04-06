import { useState, useCallback, useEffect, useRef } from "react";

const normalizeCondition = (condition) => {
	return Object.entries(condition).reduce((acc, [key, value]) => {
		if (value !== null && value !== undefined) {
			acc[key] = value;
		}
		return acc;
	}, {});
};

/**
 * Declarative hook for fetching products from local database.
 * Auto-fetches when params change — no useEffect needed in consumers.
 *
 * @param {Object} options
 * @param {Object} options.condition - filter condition (e.g., { category_id: 5 })
 * @param {string} options.propertyId - property id field (default: "id")
 * @param {Object} options.queryOptions - { limit, offset, orderBy, search }
 * @param {boolean} options.enabled - whether to fetch (default: true)
 * @returns {{ products: Array, totalCount: number, loading: boolean, error: Error|null, refetch: Function }}
 */
export default function useLocalProductList({
	condition = {},
	propertyId = "id",
	queryOptions = {},
	enabled = true,
} = {}) {
	const [products, setProducts] = useState([]);
	const [totalCount, setTotalCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	// Serialize params for stable effect dependency
	const paramsKey = JSON.stringify({ condition, propertyId, queryOptions });
	const paramsRef = useRef({ condition, propertyId, queryOptions });
	paramsRef.current = { condition, propertyId, queryOptions };

	const fetchData = useCallback(async () => {
		const { condition, propertyId, queryOptions } = paramsRef.current;
		const normalizedCondition = normalizeCondition(condition);

		setLoading(true);
		setError(null);

		try {
			const [fetchedProducts, count] = await Promise.all([
				window.dbAPI.getDataFromTable(
					"core_products",
					normalizedCondition,
					propertyId,
					queryOptions
				),
				window.dbAPI.getTableCount("core_products", normalizedCondition, {
					search: queryOptions.search,
				}),
			]);

			const productArray = Array.isArray(fetchedProducts) ? fetchedProducts : [];
			const countNumber = typeof count === "number" ? count : 0;

			setProducts(productArray);
			setTotalCount(countNumber);
			return productArray;
		} catch (err) {
			console.error("Error fetching products from local database:", err);
			setError(err);
			setProducts([]);
			setTotalCount(0);
			return [];
		} finally {
			setLoading(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paramsKey]);

	useEffect(() => {
		if (enabled) {
			fetchData();
		}
	}, [fetchData, enabled]);

	return { products, totalCount, loading, error, refetch: fetchData };
}
