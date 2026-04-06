import { useEffect, useState } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetPurchaseQuery } from "@services/purchase";

export default function usePurchaseList({ params, offlineFetch = false } = {}) {
	const networkStatus = useNetwork();
	const shouldUseOffline = offlineFetch || !networkStatus.online;

	const {
		data: purchasesResponse,
		isLoading: isOnlineLoading,
		isFetching: isOnlineFetching,
		error: onlineError,
		refetch,
	} = useGetPurchaseQuery(params, {
		skip: shouldUseOffline,
	});

	const [localPurchases, setLocalPurchases] = useState(null);
	const [isLocalLoading, setIsLocalLoading] = useState(false);
	const [localError, setLocalError] = useState(null);

	useEffect(() => {
		if (shouldUseOffline) {
			const fetchLocalPurchases = async () => {
				setIsLocalLoading(true);
				setLocalError(null);
				try {
					const purchasesData = await window.dbAPI.getDataFromTable("purchase");
					setLocalPurchases(purchasesData);
				} catch (error) {
					console.error("Error fetching local purchases:", error);
					setLocalError(error);
				} finally {
					setIsLocalLoading(false);
				}
			};

			fetchLocalPurchases();
		}
	}, [shouldUseOffline]);

	if (shouldUseOffline) {
		const offlinePurchasesResponse = localPurchases
			? {
					status: 200,
					total: Array.isArray(localPurchases) ? localPurchases.length : 0,
					data: localPurchases,
				}
			: null;

		return {
			purchases: offlinePurchasesResponse,
			isLoading: isLocalLoading,
			error: localError,
		};
	}

	return {
		purchases: purchasesResponse,
		isLoading: isOnlineLoading || isOnlineFetching,
		error: onlineError,
		refetch,
	};
}
