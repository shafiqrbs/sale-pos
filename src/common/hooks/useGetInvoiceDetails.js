import { useState, useEffect } from "react";
import { useNetwork } from "@mantine/hooks";
import { useGetInvoiceDetailsQuery } from "@services/pos";

const useGetInvoiceDetails = (tableId, { offlineFetch = false } = {}) => {
	const networkStatus = useNetwork();
	const shouldUseOffline = offlineFetch || !networkStatus.online;

	// =============== online query hook ================
	const { data: onlineInvoiceData, isLoading: isOnlineLoading, error: onlineError } = useGetInvoiceDetailsQuery(
		{ invoice_id: tableId },
		{
			skip: shouldUseOffline || !tableId,
		}
	);

	// =============== offline local data state ================
	const [ localInvoiceData, setLocalInvoiceData ] = useState(null);
	const [ isLocalLoading, setIsLocalLoading ] = useState(false);
	const [ localError, setLocalError ] = useState(null);

	// =============== fetch local data when offline or preferredMode is offline ================
	useEffect(() => {
		if (shouldUseOffline && tableId) {
			const fetchLocalInvoiceData = async () => {
				setIsLocalLoading(true);
				setLocalError(null);
				try {
					const [ invoiceTable, invoiceItems ] = await Promise.all([
						window.dbAPI.getDataFromTable("invoice_table", tableId),
						window.dbAPI.getDataFromTable("invoice_table_item"),
					]);
					const filteredItems = invoiceItems.filter((data) => Number(data.invoice_id) === Number(tableId));
					setLocalInvoiceData({ ...invoiceTable, invoice_items: filteredItems });
				} catch (error) {
					console.error("Error fetching local invoice data:", error);
					setLocalError(error);
				} finally {
					setIsLocalLoading(false);
				}
			};

			fetchLocalInvoiceData();
		}
	}, [ shouldUseOffline, tableId ]);

	// =============== return appropriate data based on preferredMode and network status ================
	if (shouldUseOffline) {
		return {
			invoiceData: localInvoiceData,
			isLoading: isLocalLoading,
			error: localError,
		};
	}

	return {
		invoiceData: onlineInvoiceData?.data?.data || null,
		isLoading: isOnlineLoading,
		error: onlineError,
	};
};

export default useGetInvoiceDetails;
