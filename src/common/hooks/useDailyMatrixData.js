import { useEffect, useState, useMemo } from "react";
import { useGetDailySummaryQuery } from "@services/report";
import { useGetSalesQuery } from "@services/sales";

function getTodayFormatted() {
	const today = new Date();
	const day = String(today.getDate()).padStart(2, "0");
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const year = today.getFullYear();
	return { ddmmyyyy: `${day}-${month}-${year}`, yyyymmdd: `${year}-${month}-${day}` };
}

const INITIAL_DATA = {
	totalSales: 0,
	totalDiscount: 0,
	totalPayment: 0,
	totalDue: 0,
	totalInvoices: 0,
	transactionModes: [],
	topProducts: [],
	salesList: [],
};

export default function useDailyMatrixData({ offlineFetch = true } = {}) {
	// =============== offline state ================
	const [offlineData, setOfflineData] = useState(INITIAL_DATA);
	const [offlineLoading, setOfflineLoading] = useState(false);
	const [offlineError, setOfflineError] = useState(null);

	// =============== online RTK Query hooks (skip when offline) ================
	const { yyyymmdd } = getTodayFormatted();

	const {
		data: summaryResponse,
		isLoading: summaryLoading,
		error: summaryError,
		refetch: refetchSummary,
	} = useGetDailySummaryQuery(
		{ start_date: yyyymmdd, end_date: yyyymmdd },
		{ skip: offlineFetch }
	);

	const {
		data: salesListResponse,
		isLoading: salesListLoading,
		error: salesListError,
		refetch: refetchSalesList,
	} = useGetSalesQuery(undefined, { skip: offlineFetch });

	// =============== offline fetch logic ================
	useEffect(() => {
		if (offlineFetch) {
			fetchOfflineData();
		}
	}, [offlineFetch]);

	const fetchOfflineData = async () => {
		setOfflineLoading(true);
		setOfflineError(null);

		try {
			const { ddmmyyyy: formattedDate } = getTodayFormatted();

			const salesData = await window.dbAPI.getDataFromTable("sales", null, "id", {
				search: {
					startsWith: {
						created: formattedDate,
					},
				},
			});

			const transactionModes = await window.dbAPI.getDataFromTable("accounting_transaction_mode");

			if (!salesData || salesData.length === 0) {
				setOfflineData(INITIAL_DATA);
				setOfflineLoading(false);
				return;
			}

			let totalSales = 0;
			let totalDiscount = 0;
			let totalPayment = 0;
			let totalDue = 0;
			const transactionModeMap = {};
			const productMap = {};

			salesData.forEach((sale) => {
				const saleTotal = Number(sale.total) || 0;
				const saleDiscount = Number(sale.discount) || 0;
				const salePayment = Number(sale.payment) || 0;
				const saleDue = saleTotal - salePayment;

				totalSales += saleTotal;
				totalDiscount += saleDiscount;
				totalPayment += salePayment;
				totalDue += saleDue;

			// =============== aggregate transaction modes from payments array ================
			if (sale.payments) {
				try {
					const payments = typeof sale.payments === "string"
						? JSON.parse(sale.payments)
						: sale.payments;

					if (Array.isArray(payments) && payments.length > 0) {
						payments.forEach((payment) => {
							const modeId = payment.transaction_mode_id;
							const amount = Number(payment.amount) || 0;
							const mode = transactionModes?.find((mode) => mode.id === modeId);
							const modeName = mode?.name || payment.transaction_mode_name || "Unknown";

							if (!transactionModeMap[modeName]) {
								transactionModeMap[modeName] = {
									name: modeName,
									amount: 0,
									count: 0,
								};
							}
							transactionModeMap[modeName].amount += amount;
							transactionModeMap[modeName].count += 1;
						});
					}
				} catch (error) {
					console.error("Error parsing payments:", error, sale);
				}
			}

				// =============== aggregate products ================
				if (sale.sales_items) {
					try {
						const salesItems =
							typeof sale.sales_items === "string"
								? JSON.parse(sale.sales_items)
								: sale.sales_items;

						salesItems.forEach((item) => {
							const productName = item.display_name || item.item_name || "Unknown";
							const quantity = Number(item.quantity) || 0;
							const salesPrice = Number(item.sales_price) || 0;
							const subTotal = Number(item.sub_total) || 0;

							if (!productMap[productName]) {
								productMap[productName] = {
									name: productName,
									totalQuantity: 0,
									totalAmount: 0,
									salesPrice: salesPrice,
								};
							}
							productMap[productName].totalQuantity += quantity;
							productMap[productName].totalAmount += subTotal;
						});
					} catch (error) {
						console.error("Error parsing sales_items:", error);
					}
				}
			});

			const transactionModesArray = Object.values(transactionModeMap).sort(
				(a, b) => b.amount - a.amount
			);

			const topProductsArray = Object.values(productMap)
				.sort((a, b) => b.totalQuantity - a.totalQuantity)
				.slice(0, 20);

			setOfflineData({
				totalSales,
				totalDiscount,
				totalPayment,
				totalDue,
				totalInvoices: salesData.length,
				transactionModes: transactionModesArray,
				topProducts: topProductsArray,
				salesList: salesData,
			});
		} catch (error) {
			console.error("Error fetching daily matrix data:", error);
			setOfflineError(error);
		} finally {
			setOfflineLoading(false);
		}
	};

	// =============== map online API response to the same shape ================
	const onlineData = useMemo(() => {
		if (offlineFetch || !summaryResponse?.data) return INITIAL_DATA;

		const apiData = summaryResponse.data;
		const { sales } = apiData;

		// =============== handle multiple possible key names the api may use for transaction modes ================
		const rawModes = apiData.transactionModes || apiData.transaction_modes || apiData.methods || [];
		const normalizedTransactionModes = Array.isArray(rawModes)
			? rawModes.map((mode) => ({
					name:
						mode.name ||
						mode.method ||
						mode.transaction_mode_name ||
						mode.modeName ||
						mode.mode_name ||
						"Unknown",
					amount: Number(
						mode.amount ?? mode.total ?? mode.total_amount ?? 0
					),
					count: Number(mode.count ?? mode.total_count ?? mode.sales_count ?? 0),
			  }))
			: [];

		// =============== handle multiple possible key names the api may use for top products ================
		const rawTopProducts =
			apiData.topSalesItem ||
			apiData.top_products ||
			apiData.topProducts ||
			apiData.top_selling_items ||
			[];
		const normalizedTopProducts = Array.isArray(rawTopProducts)
			? rawTopProducts.map((item) => ({
					name:
						item.name ||
						item.product_name ||
						item.item_name ||
						item.display_name ||
						"Unknown",
					totalQuantity: Number(item.totalQuantity ?? item.total_quantity ?? 0),
					totalAmount: Number(item.totalAmount ?? item.total_amount ?? 0),
					salesPrice: Number(item.salesPrice ?? item.sales_price ?? 0),
			  }))
			: [];

		return {
			totalSales: Number(sales?.totalSales) || 0,
			totalDiscount: Number(sales?.totalDiscount) || 0,
			totalPayment: Number(sales?.totalPayment) || 0,
			totalDue: Number(sales?.totalDue) || 0,
			totalInvoices: Number(sales?.totalInvoices) || 0,
			transactionModes: normalizedTransactionModes,
			topProducts: normalizedTopProducts,
			salesList: salesListResponse?.data || [],
		};
	}, [offlineFetch, summaryResponse, salesListResponse]);

	// =============== return based on mode ================
	if (offlineFetch) {
		return {
			dailyData: offlineData,
			isLoading: offlineLoading,
			error: offlineError,
			refetch: fetchOfflineData,
		};
	}

	return {
		dailyData: onlineData,
		isLoading: summaryLoading || salesListLoading,
		error: summaryError || salesListError,
		refetch: () => {
			refetchSummary();
			refetchSalesList();
		},
	};
}
