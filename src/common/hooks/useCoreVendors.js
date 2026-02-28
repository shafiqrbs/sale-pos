import { formatDate, formatDateTime, generateSlug } from "@utils/index";
import { useEffect, useState } from "react";

const useCoreVendors = () => {
    const [ vendors, setVendors ] = useState([]);
    const [ isLoading, setIsLoading ] = useState(false);
    const [ error, setError ] = useState(null);

    useEffect(() => {
        fetchVendors();
    }, []);

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

    const addVendor = async (vendor) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log(vendor)
            await window.dbAPI.upsertIntoTable("core_vendors", {
                name: vendor.name,
                vendor_code: crypto.randomUUID(),
                code: Math.floor(Math.random() * 1000000),
                slug: generateSlug(vendor.name),
                email: vendor.email,
                mobile: vendor.mobile,
                unique_id: crypto.randomUUID(),
                created_date: formatDate(new Date()),
                created_at: formatDateTime(new Date()),
            });

            await fetchVendors();
        } catch (error) {
            console.error(error)
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    return { vendors, isLoading, error, addVendor, refreshVendors: fetchVendors };
};

export default useCoreVendors;