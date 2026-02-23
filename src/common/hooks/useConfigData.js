import { useState, useEffect } from "react";
import { useGetConfigQuery } from "@services/core/core.js";
import { useNetwork } from "@mantine/hooks";

const useConfigData = ({ offlineFetch = false } = {}) => {
	const networkStatus = useNetwork();

	const { data: onlineConfigData } = useGetConfigQuery(undefined, {
		skip: !networkStatus.online || offlineFetch,
	});
	const [localConfigData, setLocalConfigData] = useState(null);
	const [configData, setConfigData] = useState({});

	// =============== fetch local config data from database ================
	useEffect(() => {
		const fetchLocalConfigData = async () => {
			try {
				const stored = await window.dbAPI.getDataFromTable("config-data");
				const parsedLocalData = stored?.data ? JSON.parse(stored.data) : {};
				setLocalConfigData(parsedLocalData);
			} catch (error) {
				console.error("Error fetching local config data:", error);
				setLocalConfigData({});
			}
		};

		fetchLocalConfigData();
	}, []);

	// =============== sync online config data with local database ================
	useEffect(() => {
		const syncConfigData = async () => {
			// =============== if no online data, use local data ================
			if (!onlineConfigData?.data || Object.keys(onlineConfigData?.data).length === 0) {
				setConfigData(localConfigData || {});
				return;
			}

			try {
				// =============== compare online and local config data ================
				const onlineDataString = JSON.stringify(onlineConfigData?.data);
				const localDataString = JSON.stringify(localConfigData || {});

				if (onlineDataString !== localDataString) {
					// =============== update local database with online config data ================
					await window.dbAPI.upsertIntoTable("config-data", {
						id: 1,
						data: JSON.stringify(onlineConfigData?.data),
					});

					setLocalConfigData(onlineConfigData?.data);
					setConfigData(onlineConfigData?.data);
				} else {
					// =============== if they match, use online data ================
					setConfigData(onlineConfigData?.data);
				}
			} catch (error) {
				console.error("Error syncing config data:", error);
				// =============== fallback to local data on error ================
				setConfigData(localConfigData || {});
			}
		};

		syncConfigData();
	}, [onlineConfigData, localConfigData]);

	return { configData };
};

export default useConfigData;
