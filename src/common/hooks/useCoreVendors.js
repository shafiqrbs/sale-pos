import { useEffect, useState } from "react";

const useCoreVendors = () => {
    const [ vendors, setVendors ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        const fetchVendors = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const vendors = await window.dbAPI.getDataFromTable("core_vendors");

                setVendors(vendors);
            } catch (error) {
                setError(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVendors();
    }, []);

    return { vendors, isLoading, error };
};

export default useCoreVendors;