import React, { useState, useRef } from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { useAddPurchaseReturnMutation } from "@services/purchase-return";

export default function NewIndex() {
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest());
	const [purchaseItems, setPurchaseItems] = useState([]);
	const [isAddingItem, setIsAddingItem] = useState(false);
	const [returnType, setReturnType] = useState(null);
	const itemIdCounter = useRef(0);
	const [addPurchaseReturn] = useAddPurchaseReturnMutation();

	// =============== add item to state; deduplicate by purchase_item_id (replace qty if same item added again) ===============
	const handleAddItem = (newItem) => {
		setPurchaseItems((previous) => {
			const existingIndex = previous.findIndex(
				(item) => item.purchase_item_id === newItem.purchase_item_id
			);
			if (existingIndex !== -1) {
				return previous.map((item, index) =>
					index === existingIndex
						? { ...item, quantity: newItem.quantity, sub_total: newItem.sub_total }
						: item
				);
			}
			itemIdCounter.current += 1;
			return [...previous, { ...newItem, id: itemIdCounter.current }];
		});
	};

	const handleQuantityChange = (itemId, updatedData) => {
		setPurchaseItems((previous) =>
			previous.map((item) => (item.id === itemId ? { ...item, ...updatedData } : item))
		);
	};

	const handlePriceChange = (itemId, updatedData) => {
		setPurchaseItems((previous) =>
			previous.map((item) => (item.id === itemId ? { ...item, ...updatedData } : item))
		);
	};

	const handleRemoveItem = (itemId) => {
		setPurchaseItems((previous) => previous.filter((item) => item.id !== itemId));
	};

	// =============== sync vendor_id into itemsForm when selected from InvoiceForm ===============
	const handleVendorChange = (vendorId) => {
		itemsForm.setFieldValue("vendor_id", vendorId ?? "");
	};

	const handleSubmit = async (formValues) => {
		if (!purchaseItems.length) {
			showNotification("Add minimum one purchase item first", "red");
			return;
		}

		if (!formValues.vendor_id) {
			showNotification("Vendor is required", "red");
			return;
		}

		if (!returnType) {
			showNotification("Return type is required", "red");
			return;
		}

		const invoiceDate = formValues.invoice_date
			? dayjs(formValues.invoice_date).format("YYYY-MM-DD")
			: dayjs().format("YYYY-MM-DD");

		const payload = {
			invoice_date: invoiceDate,
			issue_by_id: String(user?.id ?? ""),
			vendor_id: String(formValues.vendor_id),
			items: purchaseItems.map((item) => ({
				id: item.purchase_item_id,
				display_name: item.display_name,
				quantity: Number(item.quantity) || 0,
				purchase_quantity: Number(item.purchase_quantity) || 0,
				unit_name: item.unit_name ?? "",
				purchase_price: Number(item.purchase_price) || 0,
				sub_total:
					(Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			})),
			narration: formValues.purchaseNarration ?? "",
			return_type: returnType,
		};

		setIsAddingItem(true);
		try {
			await addPurchaseReturn(payload).unwrap();

			showNotification("Purchase return saved successfully", "teal");
			setPurchaseItems([]);
			itemIdCounter.current = 0;
			setReturnType(null);
			itemsForm.reset();
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to save purchase return", "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	return (
		<Grid columns={24} gutter={0}>
			<Grid.Col span={8}>
				<Box p="xs" pr={0}>
					<InvoiceForm
						onAddItem={handleAddItem}
						onReturnTypeChange={setReturnType}
						onVendorChange={handleVendorChange}
					/>
				</Box>
			</Grid.Col>
			<Grid.Col span={16}>
				<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
					<VendorOverview
						isAddingItem={isAddingItem}
						itemsForm={itemsForm}
						itemsProducts={purchaseItems}
						onQuantityChange={handleQuantityChange}
						onPriceChange={handlePriceChange}
						onRemoveItem={handleRemoveItem}
					/>
				</Box>
			</Grid.Col>
		</Grid>
	);
}
