import { useState, useEffect, useCallback } from "react";

const useTempSalesProducts = ({ type = "sales" } = {}) => {
	const [salesProducts, setSalesProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const refetch = useCallback(() => {
		setRefreshKey((previousKey) => previousKey + 1);
	}, []);

	useEffect(() => {
		const fetchSalesProducts = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const fetchedProducts = await window.dbAPI.getDataFromTable("temp_sales_products", {
					type,
				});
				setSalesProducts(fetchedProducts);
			} catch (fetchError) {
				setError(fetchError);
			} finally {
				setIsLoading(false);
			}
		};
		fetchSalesProducts();
	}, [type, refreshKey]);

	return {
		salesProducts,
		isLoading,
		error,
		refetch,
	};
};

export default useTempSalesProducts;
