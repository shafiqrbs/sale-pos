import { useState, useEffect, useCallback } from "react";

const useTempPurchaseProducts = ({ type = "purchase" } = {}) => {
	const [purchaseProducts, setPurchaseProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const refetch = useCallback(() => {
		setRefreshKey((previousKey) => previousKey + 1);
	}, []);

	useEffect(() => {
		const fetchPurchaseProducts = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const fetchedProducts = await window.dbAPI.getDataFromTable("temp_purchase_products", {
					type,
				});
				setPurchaseProducts(fetchedProducts);
			} catch (fetchError) {
				setError(fetchError);
			} finally {
				setIsLoading(false);
			}
		};
		fetchPurchaseProducts();
	}, [type, refreshKey]);

	return {
		purchaseProducts,
		isLoading,
		error,
		refetch,
	};
};

export default useTempPurchaseProducts;
