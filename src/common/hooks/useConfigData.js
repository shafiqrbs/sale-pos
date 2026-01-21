import { useMemo } from "react";
import { useGetConfigQuery } from "@services/core.js";

const useConfigData = () => {
	const { data: configData } = useGetConfigQuery();

	const parsedConfigData = useMemo(() => {
		if (configData && Object.keys(configData).length > 0) {
			return configData;
		}

		const stored = window.dbAPI.getDataFromTable("config-data");
		return JSON.parse(stored?.data || "{}");
	}, [ configData ]);

	return { configData: parsedConfigData };
};

export default useConfigData;
