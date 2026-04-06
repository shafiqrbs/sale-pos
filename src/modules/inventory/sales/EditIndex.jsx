import React, { useEffect, useRef, useState } from "react";
import { Box, Center, Loader, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useParams, useNavigate } from "react-router";

import InvoiceForm from "./form/InvoiceForm";
import SalesOverview from "./Overview";
import { salesOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useConfigData from "@hooks/useConfigData";
import useGetSale from "@hooks/useGetSale";
import { useTranslation } from "react-i18next";
import { APP_NAVLINKS } from "@/routes/routes";

export default function EditIndex() {
	const { t } = useTranslation();
	const { id: saleId } = useParams();
	const navigate = useNavigate();
	const { user } = useLoggedInUser();
	const { configData } = useConfigData();
	const itemsForm = useForm(salesOverviewRequest(t));

	const { sale, isLoading: isLoadingSale } = useGetSale(saleId);

	const [editItems, setEditItems] = useState([]);
	const [resetKey, setResetKey] = useState(0);
	const [isAddingItem, setIsAddingItem] = useState(false);
	const [isEditInitialized, setIsEditInitialized] = useState(false);

	const editItemIdCounter = useRef(0);
	const originalSnapshotRef = useRef(null);

	// =============== tracks whether the submit was triggered via POS Print ===============
	const withPosPrintRef = useRef(false);

	// =============== parse sales_items from the fetched sale and populate form once ===============
	useEffect(() => {
		if (!sale || isEditInitialized) return;

		editItemIdCounter.current = 0;

		const parsedItems = JSON.parse(sale.sales_items || "[]").map((item) => {
			editItemIdCounter.current += 1;
			return {
				...item,
				id: editItemIdCounter.current,
				price: item.mrp ?? item.sales_price,
				percent: 0,
				stock: 0,
				average_price: 0,
				unit_name: "",
			};
		});

		const parsedPayments = JSON.parse(sale.payments || "[]");

		const discountTypeRaw = sale.discount_type ?? "";
		const discountTypeMapped =
			discountTypeRaw === "Percentage"
				? "percentage"
				: discountTypeRaw === "Coupon"
					? "coupon"
					: "flat";

		const formValues = {
			customer_id: sale.customerId ? String(sale.customerId) : "",
			customerName: sale.customerName ?? "",
			customerMobile: sale.customerMobile ?? "",
			salesDate: sale.created ? new Date(sale.created) : new Date(),
			salesNarration: "",
			discount_type: discountTypeMapped,
			discount: sale.discount ?? 0,
			coupon_code: "",
			paymentAmount: sale.payment ?? 0,
			payments: parsedPayments,
			splitPaymentDrawerOpened: false,
		};

		setEditItems(parsedItems);
		itemsForm.setValues(formValues);

		originalSnapshotRef.current = {
			parsedItems,
			formValues,
		};

		setIsEditInitialized(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sale]);

	// =============== apply a partial update to a single item in local state ===============
	const handleEditItemUpdate = (itemId, updatedData) => {
		setEditItems((previousItems) =>
			previousItems.map((item) => (item.id === itemId ? { ...item, ...updatedData } : item))
		);
	};

	const handleEditRemoveItem = (itemId) => {
		setEditItems((previousItems) => previousItems.filter((item) => item.id !== itemId));
	};

	// =============== add new item to local state without touching temp_sales_products table ===============
	const handleAddEditItem = (newItem) => {
		editItemIdCounter.current += 1;
		const itemWithId = {
			...newItem,
			id: editItemIdCounter.current,
			price: newItem.sales_price,
			mrp: newItem.sales_price,
		};
		setEditItems((previousItems) => [...previousItems, itemWithId]);
	};

	// =============== restore original product quantities then deduct the newly saved quantities ===============
	const updateProductsAfterEdit = async (originalItems, newItems) => {
		try {
			for (const originalItem of originalItems) {
				const productResult = await window.dbAPI.getDataFromTable("core_products", {
					id: originalItem.product_id,
				});
				const productData = Array.isArray(productResult) ? productResult[0] : productResult;
				if (!productData) continue;

				const restoredQuantity = (productData.quantity || 0) + (Number(originalItem.quantity) || 0);
				const restoredTotalSales = Math.max(
					(productData.total_sales || 0) - (Number(originalItem.quantity) || 0),
					0
				);

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: originalItem.product_id },
					data: { quantity: restoredQuantity, total_sales: restoredTotalSales },
				});
			}

			for (const newItem of newItems) {
				const productResult = await window.dbAPI.getDataFromTable("core_products", {
					id: newItem.product_id,
				});
				const productData = Array.isArray(productResult) ? productResult[0] : productResult;
				if (!productData) continue;

				const soldQuantity = Number(newItem.quantity) || 0;
				const newQuantity = (productData.quantity || 0) - soldQuantity;
				const newTotalSales = (productData.total_sales || 0) + soldQuantity;

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: newItem.product_id },
					data: { quantity: newQuantity, total_sales: newTotalSales },
				});
			}

			window.dispatchEvent(new CustomEvent("products-updated"));
		} catch (error) {
			console.error("Error updating product quantities after edit:", error);
		}
	};

	const handleSubmit = async (formValues) => {
		if (!editItems.length) {
			showNotification(t("AddMinimumOneSalesItemFirst"), "red");
			return;
		}

		const payments = formValues.payments ?? [];
		if (!payments.length) {
			showNotification(t("TransactionModeRequired"), "red");
			return;
		}

		if (!formValues.paymentAmount || Number(formValues.paymentAmount) <= 0) {
			showNotification(t("PaymentAmountRequired"), "red");
			return;
		}

		const subTotal = editItems.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
			0
		);

		const discountValue =
			formValues.discount_type === "coupon" ? 0 : Number(formValues.discount) || 0;

		const vat = 0;
		const grandTotal = Math.max(subTotal - discountValue + vat, 0);
		const fullAmount = Number(formValues.paymentAmount) || 0;
		const isSplitPaymentActive = payments.length > 1;
		const modeName = isSplitPaymentActive ? "Multiple" : (payments[0]?.transaction_mode_name ?? "");

		// =============== get customer info from database ===============
		let customerName = "";
		let customerMobile = "";
		let customerAddress = "";
		if (formValues.customer_id) {
			const customers = await window.dbAPI.getDataFromTable("core_customers", {
				id: formValues.customer_id,
			});
			const customerData = Array.isArray(customers) ? customers[0] : customers;
			if (customerData) {
				customerName = customerData.name ?? "";
				customerMobile = customerData.mobile ?? "";
				customerAddress = customerData.address ?? "";
			}
		}

		const salesItemsForDb = editItems.map((item) => ({
			product_id: item.product_id,
			display_name: item.display_name,
			quantity: Number(item.quantity) || 0,
			mrp: Number(item.mrp ?? item.price ?? item.sales_price) || 0,
			sales_price: Number(item.sales_price) || 0,
			sub_total: (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
			category_id: item.category_id ?? null,
			category_name: item.category_name ?? "",
		}));

		// =============== keep the original invoice number unchanged; only recalculate financials ===============
		const salesData = {
			invoice: sale.invoice,
			sub_total: subTotal,
			total: Math.round(grandTotal),
			approved_by_id: user?.id ?? null,
			payment: fullAmount,
			discount: discountValue,
			discount_calculation: discountValue,
			discount_type:
				formValues.discount_type === "flat"
					? "Flat"
					: formValues.discount_type === "percentage"
						? "Percentage"
						: "Coupon",
			customerId: formValues.customer_id ?? null,
			customerName,
			customerMobile,
			customer_address: customerAddress,
			salesById: user?.id ?? null,
			salesByUser: user?.username ?? "",
			salesByName: user?.name ?? "",
			process: "approved",
			mode_name: modeName,
			sales_items: JSON.stringify(salesItemsForDb),
			multi_transaction: isSplitPaymentActive ? 1 : 0,
			payments: JSON.stringify(payments),
		};

		const originalItemsSnapshot = originalSnapshotRef.current?.parsedItems ?? [];

		setIsAddingItem(true);
		try {
			await window.dbAPI.updateDataInTable("sales", {
				condition: { id: Number(saleId) },
				data: salesData,
			});

			await updateProductsAfterEdit(originalItemsSnapshot, editItems);

			const shouldPrint = withPosPrintRef.current;

			showNotification(t("SaleUpdatedSuccessfully"), "teal");

			// =============== after a successful save the current items become the new baseline for
			// future resets and the next product-qty restoration cycle ===============
			const newBaseline = editItems.map((item) => ({ ...item }));
			originalSnapshotRef.current = {
				parsedItems: newBaseline,
				formValues: {
					...itemsForm.values,
					splitPaymentDrawerOpened: false,
				},
			};

			if (shouldPrint && window.deviceAPI?.thermalPrint) {
				const setup = await window.dbAPI.getDataFromTable("printer");
				if (setup?.printer_name) {
					await window.deviceAPI.thermalPrint({
						configData: { ...configData, user },
						salesItems: salesItemsForDb,
						salesViewData: salesData,
						setup,
					});
				} else {
					showNotification(t("PrinterNotSetup"), "red");
				}
			}

			navigate(APP_NAVLINKS.SALES);
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to update sale", "red");
		} finally {
			setIsAddingItem(false);
			withPosPrintRef.current = false;
		}
	};

	const handlePosPrint = () => {
		withPosPrintRef.current = true;
		// =============== trigger itemsForm submission with POS print flag set ===============
		itemsForm.onSubmit(handleSubmit)();
	};

	// =============== re-seed the form and item list from the original sale snapshot ===============
	const handleReset = () => {
		const snapshot = originalSnapshotRef.current;
		if (!snapshot) return;

		setEditItems(snapshot.parsedItems.map((item) => ({ ...item })));
		itemsForm.setValues(snapshot.formValues);
		setResetKey((previousKey) => previousKey + 1);
	};

	if (isLoadingSale) {
		return (
			<Center h={300}>
				<Loader size="md" />
			</Center>
		);
	}

	if (!sale && !isLoadingSale) {
		return (
			<Center h={300}>
				<Text c="dimmed">Sale not found.</Text>
			</Center>
		);
	}

	return (
		<Box>
			<Box p="xs" pb={0}>
				<InvoiceForm refetch={() => {}} onAddItem={handleAddEditItem} />
			</Box>
			<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
				<SalesOverview
					isAddingItem={isAddingItem}
					itemsForm={itemsForm}
					itemsProducts={editItems}
					refetch={() => {}}
					onPosPrint={handlePosPrint}
					onReset={handleReset}
					resetKey={resetKey}
					onQuantityChange={handleEditItemUpdate}
					onPriceChange={handleEditItemUpdate}
					onDiscountChange={handleEditItemUpdate}
					onRemoveItem={handleEditRemoveItem}
					isEditMode={true}
				/>
			</Box>
		</Box>
	);
}
