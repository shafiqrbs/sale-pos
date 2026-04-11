import { useState, useCallback } from "react";
import { useLazyGetProductQuery } from "@services/product";

/**
 * Map API product response fields to the local sqlite schema.
 */
const mapApiProductToLocalSchema = (apiProduct) => ({
	...apiProduct,

	product_nature: apiProduct.product_nature || "N/A",
	category: apiProduct.category_name || apiProduct.category || "",
	measurements: JSON.stringify(apiProduct.measurements || []),
	purchase_item_for_sales: JSON.stringify(apiProduct.purchase_item_for_sales || []),
});

/**
 * Hook for syncing online products to the local SQLite database.
 * Fetches all paginated pages from the server, clears the local table,
 * then bulk-inserts fresh data.
 *
 * @returns {{ syncOnlineProductsToLocal: Function, isSyncing: boolean, error: Error|null }}
 */
export default function useSyncProducts() {
	const [ triggerGetProduct ] = useLazyGetProductQuery();
	const [ isSyncing, setIsSyncing ] = useState(false);
	const [ error, setError ] = useState(null);

	const syncOnlineProductsToLocal = useCallback(
		async (fetchParams = {}) => {
			setIsSyncing(true);
			setError(null);

			try {
				const SYNC_PAGE_SIZE = 500;

				const firstPageResponse = await triggerGetProduct(
					{ ...fetchParams, page: 1, offset: SYNC_PAGE_SIZE },
					false
				).unwrap();

				const totalProductCount = firstPageResponse.total ?? 0;
				let allProducts = Array.isArray(firstPageResponse.data) ? [ ...firstPageResponse.data ] : [];

				const totalPageCount = Math.ceil(totalProductCount / SYNC_PAGE_SIZE);

				for (let currentPage = 2; currentPage <= totalPageCount; currentPage++) {
					const pageResponse = await triggerGetProduct(
						{ ...fetchParams, page: currentPage, offset: SYNC_PAGE_SIZE },
						false
					).unwrap();

					if (Array.isArray(pageResponse?.data)) {
						allProducts = [ ...allProducts, ...pageResponse.data ];
					}
				}

				if (allProducts.length === 0) {
					return { success: false, count: 0 };
				}

				const mappedProducts = allProducts.map(mapApiProductToLocalSchema);

				await window.dbAPI.clearAndInsertBulk("core_products", mappedProducts, {
					batchSize: 500,
				});

				return { success: true, count: allProducts.length };
			} catch (syncError) {
				console.error("Error syncing online products to local db:", syncError);
				setError(syncError);
				return { success: false, count: 0 };
			} finally {
				setIsSyncing(false);
			}
		},
		[ triggerGetProduct ]
	);

	return { syncOnlineProductsToLocal, isSyncing, error };
}
