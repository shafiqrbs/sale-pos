import { useState, useRef, useEffect } from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useTransactionMode from "@hooks/useTransactionMode";
import { useAddSalesReturnMutation, useGetSalesReturnItemsQuery } from "@services/sales-return";
import { useTranslation } from "react-i18next";

export default function NewIndex() {
	const { t } = useTranslation();
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest(t));
	const [salesItems, setSalesItems] = useState([]);
	const [isAddingItem, setIsAddingItem] = useState(false);
	const [selectedCustomerId, setSelectedCustomerId] = useState(null);
	const [selectedSaleId, setSelectedSaleId] = useState(null);
	const [filterDate, setFilterDate] = useState(null);
	const [filterInvoice, setFilterInvoice] = useState("");
	const [customerOptions, setCustomerOptions] = useState([]);
	const itemIdCounter = useRef(0);
	const [addSalesReturn] = useAddSalesReturnMutation();
	const { transactionMode } = useTransactionMode();

	// =============== load customers from local sqlite on mount ===============
	useEffect(() => {
		const loadCustomers = async () => {
			const customers = await window.dbAPI.getDataFromTable("core_customers");
			const options = (Array.isArray(customers) ? customers : []).map((customer) => ({
				value: String(customer.id),
				label: customer.name ?? customer.mobile ?? String(customer.id),
			}));
			setCustomerOptions(options);
		};
		loadCustomers();
	}, []);

	// =============== build query params; skip the query when no customer is selected ===============
	const queryParams = {
		...(selectedCustomerId && { customer_id: selectedCustomerId }),
		...(filterDate && { date: dayjs(filterDate).format("YYYY-MM-DD") }),
		...(filterInvoice.trim() && { invoice: filterInvoice.trim() }),
	};

	const { data: salesReturnItemsData } = useGetSalesReturnItemsQuery(queryParams, {
		skip: !selectedCustomerId,
	});

	const filteredSales = salesReturnItemsData?.data ?? [];

	const handleCustomerChange = (customerId) => {
		setSelectedCustomerId(customerId ?? null);
		setSelectedSaleId(null);
		setSalesItems([]);
		itemIdCounter.current = 0;
		itemsForm.setFieldValue("customer_id", customerId ?? "");
	};

	const handleDateChange = (dateValue) => {
		setFilterDate(dateValue);
		setSelectedSaleId(null);
		setSalesItems([]);
		itemIdCounter.current = 0;
	};

	const handleInvoiceSearchChange = (invoiceValue) => {
		setFilterInvoice(invoiceValue);
		setSelectedSaleId(null);
		setSalesItems([]);
		itemIdCounter.current = 0;
	};

	// =============== clicking a sale card loads all its items with stock=0 and damage=0 ===============
	const handleSaleCardClick = (sale) => {
		setSelectedSaleId(String(sale.id));
		itemIdCounter.current = 0;

		const newItems = (sale.sales_items ?? []).map((saleItem) => {
			itemIdCounter.current += 1;
			return {
				id: itemIdCounter.current,
				display_name: saleItem.item_name ?? saleItem.name ?? "",
				sales_quantity: saleItem.available_return_qty,
				sales_price: saleItem.sales_price,
				stock_quantity: 0,
				damage_quantity: 0,
				sub_total: 0,
				unit_name: saleItem.uom ?? "",
				sale_item_id: saleItem.id,
				warehouse_id: saleItem.warehouse_id,
			};
		});

		setSalesItems(newItems);
	};

	const handleItemUpdate = (itemId, updatedData) => {
		setSalesItems((previous) =>
			previous.map((item) => (item.id === itemId ? { ...item, ...updatedData } : item))
		);
	};

	const handleRemoveItem = (itemId) => {
		setSalesItems((previous) => previous.filter((item) => item.id !== itemId));
	};

	const handleSubmit = async (formValues) => {
		if (!salesItems.length) {
			showNotification(t("AddMinimumOnePurchaseItemFirst"), "red");
			return;
		}

		if (!formValues.customer_id) {
			showNotification(t("CustomerRequired"), "red");
			return;
		}

		const invoiceDate = formValues.invoice_date
			? dayjs(formValues.invoice_date).format("YYYY-MM-DD")
			: dayjs().format("YYYY-MM-DD");

		const payload = {
			invoice_date: invoiceDate,
			issue_by_id: String(user?.id ?? ""),
			customer_id: String(formValues.customer_id),
			items: salesItems.map((item) => ({
				id: item.sale_item_id,
				display_name: item.display_name,
				sales_quantity: Number(item.sales_quantity) || 0,
				stock_quantity: Number(item.stock_quantity) || 0,
				damage_quantity: Number(item.damage_quantity) || 0,
				unit_name: item.unit_name ?? "",
				sales_price: Number(item.sales_price) || 0,
				sub_total:
					(Number(item.stock_quantity) || 0) * (Number(item.sales_price) || 0) +
					(Number(item.damage_quantity) || 0) * (Number(item.sales_price) || 0),
				warehouse_id: item.warehouse_id,
			})),
			narration: formValues.purchaseNarration ?? "",
		};

		setIsAddingItem(true);
		try {
			await addSalesReturn(payload).unwrap();

			showNotification(t("SalesReturnSavedSuccessfully"), "teal");
			setSalesItems([]);
			itemIdCounter.current = 0;
			setSelectedSaleId(null);
			itemsForm.reset();

			// =============== re-sync customer_id and transaction mode after reset ===============
			itemsForm.setFieldValue("customer_id", selectedCustomerId ?? "");
			const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
			if (cashMethod) {
				itemsForm.setFieldValue("transactionModeId", String(cashMethod.id));
				itemsForm.setFieldValue("transactionMode", cashMethod.name);
			}
		} catch (error) {
			console.error(error);
			showNotification(error?.message || t("FailedToSaveSalesReturn"), "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	return (
		<Box p="xs" bg="var(--mantine-color-gray-1)">
			<Grid columns={24} gutter={0}>
				<Grid.Col span={6}>
					<Box>
						<InvoiceForm
							customerOptions={customerOptions}
							selectedCustomerId={selectedCustomerId}
							filteredSales={filteredSales}
							selectedSaleId={selectedSaleId}
							onCustomerChange={handleCustomerChange}
							onDateChange={handleDateChange}
							onInvoiceSearchChange={handleInvoiceSearchChange}
							onSaleCardClick={handleSaleCardClick}
						/>
					</Box>
				</Grid.Col>
				<Grid.Col span={18}>
					<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
						<VendorOverview
							isAddingItem={isAddingItem}
							itemsForm={itemsForm}
							itemsProducts={salesItems}
							onItemUpdate={handleItemUpdate}
							onRemoveItem={handleRemoveItem}
						/>
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
