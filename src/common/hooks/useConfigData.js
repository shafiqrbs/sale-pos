import { useState, useEffect, useCallback } from "react";
import { useLazyGetConfigQuery } from "@services/core/core.js";

const useConfigData = () => {
	const [triggerGetConfig] = useLazyGetConfigQuery();
	const [configData, setConfigData] = useState({});

	// =============== fetch local config data from database ================
	useEffect(() => {
		const fetchLocalConfigData = async () => {
			try {
				const stored = await window.dbAPI.getDataFromTable("config-data");
				const parsedLocalData = stored?.data ? JSON.parse(stored.data) : {};
				setConfigData(parsedLocalData);
			} catch (error) {
				console.error("Error fetching local config data:", error);
				setConfigData({});
			}
		};

		fetchLocalConfigData();
	}, []);

	// =============== refresh: fetch online config and sync to local database ================
	const refresh = useCallback(async () => {
		try {
			const result = await triggerGetConfig(undefined, false).unwrap();

			if (result?.data && Object.keys(result.data).length > 0) {
				await window.dbAPI.upsertIntoTable("config-data", {
					id: 1,
					data: JSON.stringify(result.data),
				});

				setConfigData(result.data);
			}
		} catch (error) {
			console.error("Error refreshing config data:", error);
		}
	}, [triggerGetConfig]);

	const is_pos = configData?.inventory_config?.is_pos ?? configData?.is_pos ?? 0;
	const is_purchase_online =
		configData?.inventory_config?.config_purchase?.purchase_online ??
		configData?.config_purchase?.purchase_online ??
		0;
	const is_sales_online =
		configData?.inventory_config?.config_sales?.sales_online ??
		configData?.config_sales?.sales_online ??
		0;

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol || "";

	const allowSalesZeroStock =
		configData?.inventory_config?.config_sales?.zero_stock === 1 ||
		configData?.config_sales?.zero_stock === 1;
	const allowPurchaseZeroStock =
		configData?.inventory_config?.config_purchase?.zero_stock === 1 ||
		configData?.config_purchase?.zero_stock === 1;

	return {
		configData,
		is_pos,
		is_purchase_online,
		is_sales_online,
		currencySymbol,
		allowSalesZeroStock,
		allowPurchaseZeroStock,
		refresh,
	};
};

export default useConfigData;
