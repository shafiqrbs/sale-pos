import { useState, useEffect, useCallback } from "react";

export default function useGetSale(id) {
	const [sale, setSale] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const refetch = useCallback(() => setRefreshKey((previousKey) => previousKey + 1), []);

	useEffect(() => {
		if (!id) return;

		const fetchSale = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const result = await window.dbAPI.getDataFromTable("sales", { id: Number(id) });
				const saleData = Array.isArray(result) ? result[0] : result;
				setSale(saleData ?? null);
			} catch (fetchError) {
				console.error("Error fetching sale:", fetchError);
				setError(fetchError);
			} finally {
				setIsLoading(false);
			}
		};

		fetchSale();
	}, [id, refreshKey]);

	return { sale, isLoading, error, refetch };
}
