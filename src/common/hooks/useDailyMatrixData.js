import { useEffect, useState } from "react";

export default function useDailyMatrixData() {
	const [dailyData, setDailyData] = useState({
		totalSales: 0,
		totalDiscount: 0,
		totalPayment: 0,
		totalDue: 0,
		totalInvoices: 0,
		transactionModes: [],
		topProducts: [],
		salesList: [],
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		fetchDailyData();
	}, []);

	const fetchDailyData = async () => {
		setIsLoading(true);
		setError(null);

		try {
			// =============== get today's date in the format used in the database ================
			const today = new Date();
			const day = String(today.getDate()).padStart(2, "0");
			const month = String(today.getMonth() + 1).padStart(2, "0");
			const year = today.getFullYear();
			const formattedDate = `${day}-${month}-${year}`; // DD-MM-YYYY format to match "08-02-2026, 12:53 pm"

			// =============== fetch sales data for today using database query ================
			const salesData = await window.dbAPI.getDataFromTable("sales", null, "id", {
				search: {
					startsWith: {
						created: formattedDate,
					},
				},
			});

			console.log(salesData);

			// =============== fetch transaction modes for reference ================
			const transactionModes = await window.dbAPI.getDataFromTable("accounting_transaction_mode");

			if (!salesData || salesData.length === 0) {
				setDailyData({
					totalSales: 0,
					totalDiscount: 0,
					totalPayment: 0,
					totalDue: 0,
					totalInvoices: 0,
					transactionModes: [],
					topProducts: [],
					salesList: [],
				});
				setIsLoading(false);
				return;
			}

			// =============== calculate total sales, discount, payment, and due ================
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

			// =============== convert maps to arrays and sort ================
			const transactionModesArray = Object.values(transactionModeMap).sort(
				(a, b) => b.amount - a.amount
			);

			const topProductsArray = Object.values(productMap)
				.sort((a, b) => b.totalQuantity - a.totalQuantity)
				.slice(0, 20); // =============== top 20 products ================

			setDailyData({
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
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		dailyData,
		isLoading,
		error,
		refetch: fetchDailyData,
	};
}
