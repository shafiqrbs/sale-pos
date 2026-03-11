import React from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { useAddPurchaseMutation } from "@services/purchase";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempPurchaseProducts from "@hooks/useTempPurchaseProducts";

export default function NewIndex() {
	const [addPurchase, { isLoading: isAddingPurchase }] = useAddPurchaseMutation();

	const purchaseForm = useForm(vendorOverviewRequest());

	const { purchaseProducts, refetch } = useTempPurchaseProducts({ type: "purchase" });

	const handleSubmit = async (formValues) => {
		if (!purchaseProducts?.length) {
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

		const subTotal = purchaseProducts.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			0
		);

		const discountValue = formValues.isDiscountPercentage
			? (subTotal * (Number(formValues.discountAmount) || 0)) / 100
			: Number(formValues.discountAmount) || 0;

		const vat = 0;
		const total = Math.max(subTotal - discountValue + vat, 0);

		const payload = {
			vendor_id: formValues.vendor_id ?? "",
			vendor_name: formValues.vendorName ?? "",
			vendor_mobile: formValues.vendorPhone ?? "",
			vendor_email: formValues.vendorEmail ?? "",
			sub_total: subTotal,
			transaction_mode_id: formValues.transactionModeId ?? "",
			discount_type: formValues.isDiscountPercentage ? "Percentage" : "Flat",
			discount: Number(formValues.discountAmount) || 0,
			discount_calculation: discountValue,
			vat,
			total,
			payment: String(formValues.paymentAmount ?? ""),
			process: "",
			narration: formValues.purchaseNarration ?? "",
			warehouse_id: "",
			invoice_date: formValues.purchaseDate
				? dayjs(formValues.purchaseDate).format("YYYY-MM-DD")
				: dayjs().format("YYYY-MM-DD"),
			items: purchaseProducts.map((item) => ({
				product_id: item.product_id,
				warehouse_id: item.warehouse_id || null,
				quantity: Number(item.quantity) || 0,
				purchase_price: Number(item.purchase_price) || 0,
				sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
				bonus_quantity: item.bonus_quantity || 0,
				sub_total: (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
				name: item.display_name ?? "",
				category_id: item.category_id ?? null,
				category_name: item.category_name ?? "",
			})),
		};

		try {
			const response = await addPurchase(payload).unwrap();
			if (response.data) {
				showNotification("Purchase added successfully", "teal");
				// =============== clear persisted temp items after successful purchase submission ===============
				await window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "purchase" });
				refetch();
				purchaseForm.reset();
			} else {
				showNotification(response.message, "red");
			}
		} catch (error) {
			console.error(error);
			showNotification(error.data?.message, "red");
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
				<Box component="form" id="purchaseForm" onSubmit={purchaseForm.onSubmit(handleSubmit)}>
					<VendorOverview
						isAddingPurchase={isAddingPurchase}
						purchaseForm={purchaseForm}
						purchaseProducts={purchaseProducts}
						refetch={refetch}
					/>
				</Box>
			</Grid.Col>
		</Grid>
	);
}
