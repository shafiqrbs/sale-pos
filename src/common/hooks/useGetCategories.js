import { useState, useEffect } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetCategoriesQuery } from "@services/pos";

const useGetCategories = ({ offlineFetch = false }) => {
    const networkStatus = useNetwork();
    const shouldUseOffline = offlineFetch || !networkStatus.online;

    // =============== online query hook ================
    const { data: onlineCategories, isLoading: isOnlineLoading, error: onlineError } = useGetCategoriesQuery(undefined, {
        skip: shouldUseOffline,
    });

    // =============== offline local data state ================
    const [ localCategories, setLocalCategories ] = useState(null);
    const [ isLocalLoading, setIsLocalLoading ] = useState(false);
    const [ localError, setLocalError ] = useState(null);

    // =============== fetch local data when offline or preferredMode is offline ================
    useEffect(() => {
        if (shouldUseOffline) {
            const fetchLocalCategories = async () => {
                setIsLocalLoading(true);
                setLocalError(null);
                try {
                    const categoriesData = await window.dbAPI.getDataFromTable("categories");
                    setLocalCategories(categoriesData);
                } catch (error) {
                    console.error("Error fetching local categories:", error);
                    setLocalError(error);
                } finally {
                    setIsLocalLoading(false);
                }
            };

            fetchLocalCategories();
        }
    }, [ shouldUseOffline ]);

    // =============== return appropriate data based on preferredMode and network status ================
    if (shouldUseOffline) {
        return {
            categories: localCategories,
            isLoading: isLocalLoading,
            error: localError,
        };
    }

    return {
        categories: onlineCategories?.data || [],
        isLoading: isOnlineLoading,
        error: onlineError,
    };
};

export default useGetCategories;