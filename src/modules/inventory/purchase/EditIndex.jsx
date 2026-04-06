import React, { useEffect, useRef, useState } from "react";
import { Box, Center, Grid, Loader, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useParams, useNavigate } from "react-router";

import InvoiceForm from "./form/InvoiceForm";
import PurchaseOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useGetPurchase from "@hooks/useGetPurchase";
import { APP_NAVLINKS } from "@/routes/routes";
import { useTranslation } from "react-i18next";

export default function EditIndex() {
	const { t } = useTranslation();
	const { id: purchaseId } = useParams();
	const navigate = useNavigate();
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest(t));

	const { purchase, isLoading: isLoadingPurchase } = useGetPurchase(purchaseId);

	const [ editItems, setEditItems ] = useState([]);
	const [ isAddingItem, setIsAddingItem ] = useState(false);
	const [ isEditInitialized, setIsEditInitialized ] = useState(false);

	const editItemIdCounter = useRef(0);
	const originalSnapshotRef = useRef(null);

	// =============== parse purchase_items from the fetched purchase and populate form once ===============
	useEffect(() => {
		if (!purchase || isEditInitialized) return;

		editItemIdCounter.current = 0;

		const parsedItems = JSON.parse(purchase.purchase_items || "[]").map((item) => {
			editItemIdCounter.current += 1;
			return {
				...item,
				id: editItemIdCounter.current,
				price: item.mrp ?? item.purchase_price,
				percent: 0,
				stock: 0,
				average_price: item.average_price ?? 0,
				unit_name: item.unit_name ?? "",
			};
		});

		const discountTypeMapped = purchase.discount_type === "Percentage";

		const formValues = {
			vendor_id: purchase.vendor_id ? String(purchase.vendor_id) : "",
			vendorName: purchase.vendor_name ?? "",
			vendorPhone: "+880",
			vendorEmail: "",
			purchaseDate: purchase.created ? new Date(purchase.created) : new Date(),
			purchaseNarration: "",
			discountAmount: purchase.discount ?? 0,
			isDiscountPercentage: discountTypeMapped,
			paymentAmount: purchase.payment ?? 0,
			transactionModeId: purchase.transaction_mode_id ? String(purchase.transaction_mode_id) : "",
			transactionMode: purchase.mode_name ?? "",
		};

		setEditItems(parsedItems);
		itemsForm.setValues(formValues);

		originalSnapshotRef.current = {
			parsedItems,
			formValues,
		};

		setIsEditInitialized(true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ purchase ]);

	// =============== apply a partial update to a single item in local state ===============
	const handleEditItemUpdate = (itemId, updatedData) => {
		setEditItems((previousItems) =>
			previousItems.map((item) => (item.id === itemId ? { ...item, ...updatedData } : item))
		);
	};

	const handleEditRemoveItem = (itemId) => {
		setEditItems((previousItems) => previousItems.filter((item) => item.id !== itemId));
	};

	// =============== add new item to local state without touching temp_purchase_products table ===============
	const handleAddEditItem = (newItem) => {
		editItemIdCounter.current += 1;
		const itemWithId = {
			...newItem,
			id: editItemIdCounter.current,
			price: newItem.purchase_price,
			mrp: newItem.purchase_price,
		};
		setEditItems((previousItems) => [ ...previousItems, itemWithId ]);
	};

	// =============== restore original product quantities then deduct the newly saved quantities ===============
	const updateProductsAfterEdit = async (originalItems, newItems) => {
		try {
			// =============== restore: undo original purchase quantities ===============
			for (const originalItem of originalItems) {
				const productResult = await window.dbAPI.getDataFromTable("core_products", {
					id: originalItem.product_id,
				});
				const productData = Array.isArray(productResult) ? productResult[ 0 ] : productResult;
				if (!productData) continue;

				const restoredQuantity = (productData.quantity || 0) - (Number(originalItem.quantity) || 0);

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: originalItem.product_id },
					data: { quantity: restoredQuantity },
				});
			}

			// =============== deduct: apply new purchase quantities ===============
			for (const newItem of newItems) {
				const productResult = await window.dbAPI.getDataFromTable("core_products", {
					id: newItem.product_id,
				});
				const productData = Array.isArray(productResult) ? productResult[ 0 ] : productResult;
				if (!productData) continue;

				const purchasedQuantity = Number(newItem.quantity) || 0;
				const newQuantity = (productData.quantity || 0) + purchasedQuantity;

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: newItem.product_id },
					data: { quantity: newQuantity },
				});
			}

			window.dispatchEvent(new CustomEvent("products-updated"));
		} catch (error) {
			console.error("Error updating product quantities after edit:", error);
		}
	};

	const handleSubmit = async (formValues) => {
		if (!editItems.length) {
			showNotification(t("AddMinimumOnePurchaseItemFirst"), "red");
			return;
		}

		if (!formValues.transactionModeId && !formValues.transactionMode) {
			showNotification(t("TransactionModeRequired"), "red");
			return;
		}

		if (!formValues.paymentAmount || Number(formValues.paymentAmount) <= 0) {
			showNotification(t("PaymentAmountRequired"), "red");
			return;
		}

		const subTotal = editItems.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			0
		);

		const discountValue = formValues.isDiscountPercentage
			? (subTotal * (Number(formValues.discountAmount) || 0)) / 100
			: Number(formValues.discountAmount) || 0;

		const vat = 0;
		const grandTotal = Math.max(subTotal - discountValue + vat, 0);
		const fullAmount = Number(formValues.paymentAmount) || 0;

		// =============== get vendor info from local vendors table ===============
		let vendorName = formValues.vendorName ?? "";
		if (formValues.vendor_id) {
			const vendorResult = await window.dbAPI.getDataFromTable("core_vendors", {
				id: Number(formValues.vendor_id),
			});
			const vendorData = Array.isArray(vendorResult) ? vendorResult[ 0 ] : vendorResult;
			if (vendorData) {
				vendorName = vendorData.name ?? vendorName;
			}
		}

		const purchaseItemsForDb = editItems.map((item) => ({
			product_id: item.product_id,
			display_name: item.display_name,
			quantity: Number(item.quantity) || 0,
			mrp: Number(item.mrp ?? item.price ?? item.purchase_price) || 0,
			purchase_price: Number(item.purchase_price) || 0,
			sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
			sub_total: (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			category_id: item.category_id ?? null,
			category_name: item.category_name ?? "",
			unit_name: item.unit_name ?? "",
			average_price: Number(item.average_price) || 0,
			expired_date: item.expired_date ?? null,
		}));

		// =============== keep the original invoice number unchanged; only recalculate financials ===============
		const purchaseData = {
			invoice: purchase.invoice,
			sub_total: subTotal,
			total: Math.round(grandTotal),
			payment: fullAmount,
			discount: Number(formValues.discountAmount) || 0,
			discount_calculation: discountValue,
			discount_type: formValues.isDiscountPercentage ? "Percentage" : "Flat",
			approved_by_id: user?.id ?? null,
			vendor_id: formValues.vendor_id ? Number(formValues.vendor_id) : null,
			vendor_name: vendorName,
			createdByUser: user?.username ?? "",
			createdByName: user?.name ?? "",
			createdById: user?.id ?? null,
			process: purchase.process ?? "",
			mode_name: formValues.transactionMode ?? purchase.mode_name ?? "",
			transaction_mode_id: formValues.transactionModeId ? Number(formValues.transactionModeId) : null,
			purchase_items: JSON.stringify(purchaseItemsForDb),
		};

		const originalItemsSnapshot = originalSnapshotRef.current?.parsedItems ?? [];

		setIsAddingItem(true);
		try {
			await window.dbAPI.updateDataInTable("purchase", {
				condition: { id: Number(purchaseId) },
				data: purchaseData,
			});

			await updateProductsAfterEdit(originalItemsSnapshot, editItems);

			showNotification(t("PurchaseUpdatedSuccessfully"), "teal");

			// =============== after a successful save the current items become the new baseline ===============
			const newBaseline = editItems.map((item) => ({ ...item }));
			originalSnapshotRef.current = {
				parsedItems: newBaseline,
				formValues: { ...itemsForm.values },
			};

			navigate(APP_NAVLINKS.PURCHASE);
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to update purchase", "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	// =============== re-seed the form and item list from the original purchase snapshot ===============
	const handleReset = () => {
		const snapshot = originalSnapshotRef.current;
		if (!snapshot) return;

		setEditItems(snapshot.parsedItems.map((item) => ({ ...item })));
		itemsForm.setValues(snapshot.formValues);
	};

	if (isLoadingPurchase) {
		return (
			<Center h={300}>
				<Loader size="md" />
			</Center>
		);
	}

	if (!purchase && !isLoadingPurchase) {
		return (
			<Center h={300}>
				<Text c="dimmed">Purchase not found.</Text>
			</Center>
		);
	}

	return (
		<Grid columns={24} gutter={0}>
			<Grid.Col span={6}>
				<Box p="xs" pr={0}>
					<InvoiceForm refetch={() => { }} onAddItem={handleAddEditItem} />
				</Box>
			</Grid.Col>
			<Grid.Col span={18}>
				<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
					<PurchaseOverview
						isAddingItem={isAddingItem}
						itemsForm={itemsForm}
						itemsProducts={editItems}
						refetch={() => { }}
						onQuantityChange={handleEditItemUpdate}
						onPriceChange={handleEditItemUpdate}
						onRemoveItem={handleEditRemoveItem}
						isEditMode={true}
					/>
				</Box>
			</Grid.Col>
		</Grid>
	);
}
