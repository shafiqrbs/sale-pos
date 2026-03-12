import { useState, useEffect, useCallback } from "react";

export default function useGetPurchase(id) {
	const [purchase, setPurchase] = useState(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [refreshKey, setRefreshKey] = useState(0);

	const refetch = useCallback(() => setRefreshKey((previousKey) => previousKey + 1), []);

	useEffect(() => {
		if (!id) return;

		const fetchPurchase = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const result = await window.dbAPI.getDataFromTable("purchase", { id: Number(id) });
				const purchaseData = Array.isArray(result) ? result[0] : result;
				setPurchase(purchaseData ?? null);
			} catch (fetchError) {
				console.error("Error fetching purchase:", fetchError);
				setError(fetchError);
			} finally {
				setIsLoading(false);
			}
		};

		fetchPurchase();
	}, [id, refreshKey]);

	return { purchase, isLoading, error, refetch };
}
