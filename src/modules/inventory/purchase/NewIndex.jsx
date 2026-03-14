import React, { useState } from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempPurchaseProducts from "@hooks/useTempPurchaseProducts";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { generateInvoiceId, formatDateTime } from "@utils/index";

export default function NewIndex() {
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest());
	const { purchaseProducts: itemsProducts, refetch } = useTempPurchaseProducts({ type: "purchase" });
	const [ isAddingItem, setIsAddingItem ] = useState(false);

	// =============== update product quantities after successful purchase ===============
	const updateProductsAfterPurchase = async () => {
		try {
			for (const cartItem of itemsProducts) {
				const productId = cartItem.product_id;
				const currentProduct = await window.dbAPI.getDataFromTable("core_products", {
					id: productId,
				});
				const currentProductData = Array.isArray(currentProduct)
					? currentProduct[ 0 ]
					: currentProduct;

				if (!currentProductData) {
					console.error(`Product not found in database: ${productId}`);
					continue;
				}

				const purchasedQuantity = Number(cartItem.quantity) || 0;
				const newQuantity = (currentProductData.quantity || 0) + purchasedQuantity;

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: productId },
					data: { quantity: newQuantity },
				});
			}
			window.dispatchEvent(new CustomEvent("products-updated"));
		} catch (error) {
			console.error("Error updating products after purchase:", error);
		}
	};

	const handleSubmit = async (formValues) => {
		if (!itemsProducts?.length) {
			showNotification("Add minimum one purchase item first", "red");
			return;
		}

		if (!formValues.vendor_id) {
			showNotification("Vendor is required", "red");
			return;
		}
		if (!formValues.transactionModeId) {
			showNotification("Transaction mode is required", "red");
			return;
		}
		if (!formValues.paymentAmount) {
			showNotification("Payment amount is required", "red");
			return;
		}

		const subTotal = itemsProducts.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			0
		);

		const discountValue = formValues.isDiscountPercentage
			? (subTotal * (Number(formValues.discountAmount) || 0)) / 100
			: Number(formValues.discountAmount) || 0;

		const vat = 0;
		const total = Math.max(subTotal - discountValue + vat, 0);

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

		const purchaseItemsForDb = itemsProducts.map((item) => ({
			product_id: item.product_id,
			display_name: item.display_name,
			quantity: Number(item.quantity) || 0,
			mrp: Number(item.mrp ?? item.purchase_price) || 0,
			purchase_price: Number(item.purchase_price) || 0,
			sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
			sub_total: (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			category_id: item.category_id ?? null,
			category_name: item.category_name ?? "",
			unit_name: item.unit_name ?? "",
			average_price: Number(item.average_price) || 0,
			expired_date: item.expired_date ?? null,
		}));

		const localPurchaseRecord = {
			invoice: generateInvoiceId(),
			sub_total: subTotal,
			total: Math.round(total),
			payment: Number(formValues.paymentAmount) || 0,
			discount: Number(formValues.discountAmount) || 0,
			discount_calculation: discountValue,
			discount_type: formValues.isDiscountPercentage ? "Percentage" : "Flat",
			approved_by_id: user?.id ?? null,
			vendor_id: formValues.vendor_id ? Number(formValues.vendor_id) : null,
			vendor_name: vendorName,
			createdByUser: user?.username ?? "",
			createdByName: user?.name ?? "",
			createdById: user?.id ?? null,
			process: "",
			mode_name: formValues.transactionMode ?? "",
			transaction_mode_id: formValues.transactionModeId ? Number(formValues.transactionModeId) : null,
			purchase_items: JSON.stringify(purchaseItemsForDb),
			created: formatDateTime(new Date()),
		};

		setIsAddingItem(true);
		try {
			await window.dbAPI.upsertIntoTable("purchase", localPurchaseRecord);
			await updateProductsAfterPurchase();

			showNotification("Purchase added successfully", "teal");

			// =============== clear persisted temp items after successful purchase submission ===============
			await window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "purchase" });
			refetch();

			// =============== partial reset: preserve vendor + transaction mode ===============
			const preservedValues = {
				vendor_id: itemsForm.values.vendor_id,
				vendorName: itemsForm.values.vendorName,
				vendorPhone: itemsForm.values.vendorPhone,
				vendorEmail: itemsForm.values.vendorEmail,
				transactionMode: itemsForm.values.transactionMode,
				transactionModeId: itemsForm.values.transactionModeId,
			};
			itemsForm.reset();
			Object.entries(preservedValues).forEach(([ key, value ]) => {
				itemsForm.setFieldValue(key, value);
			});
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to save purchase", "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	return (
		<Grid columns={24} gutter={0}>
			<Grid.Col span={6}>
				<Box p="xs" pr={0}>
					<InvoiceForm refetch={refetch} />
				</Box>
			</Grid.Col>
			<Grid.Col span={18}>
				<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
					<VendorOverview
						isAddingItem={isAddingItem}
						itemsForm={itemsForm}
						itemsProducts={itemsProducts}
						refetch={refetch}
					/>
				</Box>
			</Grid.Col>
		</Grid>
	);
}
