import React, { useState } from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempPurchaseProducts from "@hooks/useTempPurchaseProducts";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useConfigData from "@hooks/useConfigData";
import { useAddInvoicePurchaseMutation } from "@services/invoice-purchase";
import { generateInvoiceId, formatDateTime, formatDateISO } from "@utils/index";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";

export default function NewIndex() {
	const { t } = useTranslation();

	const { user } = useLoggedInUser();
	const { isOnline } = useOutletContext();
	const { is_purchase_online } = useConfigData();
	const [ addInvoicePurchase ] = useAddInvoicePurchaseMutation();
	const shouldSubmitPurchaseOnline = isOnline && is_purchase_online;
	const itemsForm = useForm(vendorOverviewRequest(t));
	const { purchaseProducts: itemsProducts, refetch } = useTempPurchaseProducts({
		type: "invoice_purchase",
	});
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
			showNotification(t("AddMinimumOnePurchaseItemFirst"), "red");
			return;
		}

		if (!formValues.vendor_id) {
			showNotification(t("VendorRequired"), "red");
			return;
		}
		if (!formValues.transactionModeId) {
			showNotification(t("TransactionModeRequired"), "red");
			return;
		}
		if (!formValues.paymentAmount) {
			showNotification(t("PaymentAmountRequired"), "red");
			return;
		}

		const subTotal = itemsProducts.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.mrp) || 0),
			0
		);

		const paymentAmount = Number(formValues.paymentAmount) || 0;
		const dueAmount = Number(formValues.dueAmount) || 0;
		const discountValue = Math.max(subTotal - paymentAmount - dueAmount, 0);
		const total = subTotal;

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
			sub_total: (Number(item.quantity) || 0) * (Number(item.mrp) || 0),
			category_id: item.category_id ?? null,
			category_name: item.category_name ?? "",
			unit_name: item.unit_name ?? "",
			bonus_quantity: Number(item.bonus_quantity) || 0,
			average_price: Number(item.average_price) || 0,
			expired_date: item.expired_date ?? null,
			sales_quantity: Number(item.sales_quantity) || 0,
		}));

		const localPurchaseRecord = {
			invoice: generateInvoiceId(),
			sub_total: subTotal,
			total: Math.round(paymentAmount),
			payment: paymentAmount,
			due: dueAmount,
			discount: discountValue,
			discount_calculation: discountValue,
			discount_type: "Flat",
			approved_by_id: user?.id ?? null,
			vendor_id: formValues.vendor_id ? Number(formValues.vendor_id) : null,
			vendor_name: vendorName,
			createdByUser: user?.username ?? "",
			createdByName: user?.name ?? "",
			createdById: user?.id ?? null,
			process: "",
			mode_name: formValues.transactionMode ?? "",
			transaction_mode_id: formValues.transactionModeId
				? Number(formValues.transactionModeId)
				: null,
			purchase_items: JSON.stringify(purchaseItemsForDb),
			created: formatDateTime(new Date()),
			purchase_mode: "invoice",
		};

		const buildPurchaseApiPayload = () => ({
			vendor_id: String(formValues.vendor_id ?? ""),
			vendor_name: formValues.vendorName ?? "",
			vendor_mobile: formValues.vendorPhone ?? "",
			vendor_email: formValues.vendorEmail ?? "",
			sub_total: subTotal,
			transaction_mode_id: Number(formValues.transactionModeId) || 0,
			//	discount_type: purchaseDiscountTypeLabel,
			discount: discountValue,
			discount_calculation: 0,
			//	vat,
			total: Math.round(total),
			payment: String(formValues.paymentAmount ?? ""),
			process: "",
			narration: formValues.purchaseNarration ?? "",
			warehouse_id: "",
			invoice_date: formatDateISO(formValues.purchaseDate ?? new Date()),
			items: itemsProducts.map((item) => ({
				product_id: item.product_id,
				warehouse_id: item.warehouse_id ?? null,
				quantity: Number(item.quantity) || 0,
				purchase_price: Number(item.purchase_price) || 0,
				sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
				bonus_quantity: Number(item.bonus_quantity) || 0,
				sub_total: Number(item.sub_total) || 0,
				name: item.display_name ?? "",
			})),
			purchase_mode: "invoice",
		});

		setIsAddingItem(true);
		try {
			if (shouldSubmitPurchaseOnline) {
				await addInvoicePurchase(buildPurchaseApiPayload()).unwrap();
			} else {
				await window.dbAPI.upsertIntoTable("purchase", localPurchaseRecord);
			}
			await updateProductsAfterPurchase();

			showNotification(t("PurchaseAddedSuccessfully"), "teal");

			// =============== clear persisted temp items after successful purchase submission ===============
			await window.dbAPI.deleteDataFromTable("temp_purchase_products", {
				type: "invoice_purchase",
			});
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
