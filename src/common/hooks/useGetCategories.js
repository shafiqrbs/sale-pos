import { useState, useEffect } from "react";

const useGetCategories = () => {
    const [ localCategories, setLocalCategories ] = useState(null);
    const [ isLocalLoading, setIsLocalLoading ] = useState(false);
    const [ localError, setLocalError ] = useState(null);

    useEffect(() => {
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
    }, []);

    return {
        categories: localCategories,
        isLoading: isLocalLoading,
        error: localError,
    };
};

export default useGetCategories;