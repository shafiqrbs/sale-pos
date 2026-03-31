import React, { useEffect, useState } from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempPurchaseProducts from "@hooks/useTempPurchaseProducts";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { formatDateISO } from "@utils/index";
import { useAddRequisitionMutation } from "@services/requisition";

export default function NewIndex() {
	const [ addRequisition, { isLoading: isAddingRequisition } ] = useAddRequisitionMutation();
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest());
	console.log(itemsForm.errors)
	const { purchaseProducts: itemsProducts, refetch } = useTempPurchaseProducts({ type: "requisition" });
	const [ isAddingItem, setIsAddingItem ] = useState(false);

	// =============== clear stale temp items on mount (safety net for abandoned edits) ===============
	useEffect(() => {
		const clearStaleTempItems = async () => {
			await window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "requisition" });
			refetch();
		};
		clearStaleTempItems();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleSubmit = async (formValues) => {
		if (!itemsProducts?.length) {
			showNotification("Add minimum one purchase item first", "red");
			return;
		}

		if (!formValues.vendor_id) {
			showNotification("Vendor is required", "red");
			return;
		}

		const requisitionItemsForDb = itemsProducts.map((item) => ({
			product_id: item.product_id,
			display_name: item.display_name,
			unit_name: item.unit_name ?? "",
			quantity: Number(item.quantity) || 0,
			purchase_price: Number(item.purchase_price) || 0,
			sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
			sub_total: (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
		}));

		const newRequisition = {
			invoice_date: formValues.invoice_date ? formatDateISO(formValues.invoice_date) : null,
			expected_date: formValues.expected_date ? formatDateISO(formValues.expected_date) : null,
			remark: formValues.remark ?? "",
			created_by_id: user?.id ?? null,
			items: requisitionItemsForDb,
			process: "Created",
			vendor_id: formValues.vendor_id ? Number(formValues.vendor_id) : null,
			warehouse_id: formValues.warehouse_id ? Number(formValues.warehouse_id) : null,
		};

		setIsAddingItem(true);
		try {
			const res = await addRequisition(newRequisition).unwrap();

			if (res.data) {
				showNotification("Requisition added successfully", "teal");

				// =============== clear persisted temp items after successful purchase submission ===============
				await window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "requisition" });
				refetch();

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
			} else {
				showNotification("Failed to save requisition", "red");
			}
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to save requisition", "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	return (
		<Grid columns={24} gutter={0}>
			<Grid.Col span={6}>
				<Box p="xs" pr={0}>
					<InvoiceForm
						refetch={refetch}
						onVendorChange={(vendorId) => itemsForm.setFieldValue("vendor_id", vendorId)}
					/>
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
