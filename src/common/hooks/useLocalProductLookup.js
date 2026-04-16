import { useState, useCallback } from "react";

/**
 * Imperative hook for on-demand single product lookups.
 * Each call gets its own loading/error state, independent of other hooks.
 *
 * @returns {{ getProduct: Function, getProductByBarcode: Function, loading: boolean, error: Error|null }}
 */
export default function useLocalProductLookup() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const getProduct = useCallback(async (stockId) => {
		setLoading(true);
		setError(null);

		try {
			const fetchedProducts = await window.dbAPI.getDataFromTable("core_products", {
				stock_id: stockId,
			});

			if (fetchedProducts && fetchedProducts.length > 0) {
				return fetchedProducts[0];
			}

			return null;
		} catch (err) {
			console.error("Error fetching product by stock id:", err);
			setError(err);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	// =============== search core_products by the barcode field (indexed); returns first match or null ===============
	const getProductByBarcode = useCallback(async (barcode) => {
		setLoading(true);
		setError(null);

		try {
			const fetchedProducts = await window.dbAPI.getDataFromTable("core_products", {
				barcode,
			});

			if (fetchedProducts && fetchedProducts.length > 0) {
				return fetchedProducts[0];
			}

			return null;
		} catch (err) {
			console.error("Error fetching product by barcode:", err);
			setError(err);
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	return { getProduct, getProductByBarcode, loading, error };
}
