import { useState, useEffect } from "react";

const useGetInvoiceDetails = (tableId) => {
	const [ localInvoiceData, setLocalInvoiceData ] = useState(null);
	const [ isLocalLoading, setIsLocalLoading ] = useState(false);
	const [ localError, setLocalError ] = useState(null);

	useEffect(() => {
		if (tableId) {
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
	}, [ tableId ]);

	return {
		invoiceData: localInvoiceData,
		isLoading: isLocalLoading,
		error: localError,
	};
};

export default useGetInvoiceDetails;
