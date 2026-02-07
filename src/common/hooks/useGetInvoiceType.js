import { useState, useEffect } from "react";

const useGetInvoiceType = () => {
    const [ localInvoiceType, setLocalInvoiceType ] = useState(null);
    const [ isLocalInvoiceTypeLoading, setIsLocalInvoiceTypeLoading ] = useState(false);
    const [ localInvoiceTypeError, setLocalInvoiceTypeError ] = useState(null);

    useEffect(() => {
        const fetchLocalInvoiceType = async () => {
            setIsLocalInvoiceTypeLoading(true);
            setLocalInvoiceTypeError(null);
            try {
                const invoiceTypeData = await window.dbAPI.getDataFromTable("invoice_table");
                setLocalInvoiceType(invoiceTypeData);
            } catch (error) {
                console.error("Error fetching local invoice type:", error);
                setLocalInvoiceTypeError(error);
            } finally {
                setIsLocalInvoiceTypeLoading(false);
            }
        };

        fetchLocalInvoiceType();
    }, []);

    return {
        invoiceType: localInvoiceType,
        isLoading: isLocalInvoiceTypeLoading,
        error: localInvoiceTypeError,
    };
};

export default useGetInvoiceType;