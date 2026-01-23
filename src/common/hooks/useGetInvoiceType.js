import { useState, useEffect } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetInvoiceModeQuery } from "@services/pos";

const useGetInvoiceType = ({ offlineFetch = false }) => {
    const networkStatus = useNetwork();
    const shouldUseOffline = offlineFetch || !networkStatus.online;

    // =============== online query hook ================
    const { data: onlineInvoiceType, isLoading: isOnlineLoading, error: onlineError } = useGetInvoiceModeQuery(undefined, {
        skip: shouldUseOffline,
    });

    // =============== offline local data state ================
    const [ localInvoiceType, setLocalInvoiceType ] = useState(null);
    const [ isLocalInvoiceTypeLoading, setIsLocalInvoiceTypeLoading ] = useState(false);
    const [ localInvoiceTypeError, setLocalInvoiceTypeError ] = useState(null);

    // =============== fetch local data when offline or preferredMode is offline ================
    useEffect(() => {
        if (shouldUseOffline) {
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
        }
    }, [ shouldUseOffline ]);

    // =============== return appropriate data based on preferredMode and network status ================
    if (shouldUseOffline) {
        return {
            invoiceType: localInvoiceType,
            isLoading: isLocalInvoiceTypeLoading,
            error: localInvoiceTypeError,
        };
    }

    return {
        invoiceType: onlineInvoiceType?.data || [],
        isLoading: isOnlineLoading,
        error: onlineError,
    };
};

export default useGetInvoiceType;