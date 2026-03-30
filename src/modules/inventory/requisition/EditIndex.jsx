import React, { useEffect, useRef, useState } from "react";
import { Box, Center, Grid, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useParams, useNavigate } from "react-router";

import InvoiceForm from "./form/InvoiceForm";
import PurchaseOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useTempPurchaseProducts from "@hooks/useTempPurchaseProducts";
import { useGetRequisitionByIdQuery, useUpdateRequisitionMutation } from "@services/requisition";
import { formatDateISO } from "@utils/index";
import { APP_NAVLINKS } from "@/routes/routes";
import RequisitionEditSkeleton from "@components/skeletons/RequisitionEditSkeleton";

export default function EditIndex() {
	const { id: requisitionId } = useParams();
	const navigate = useNavigate();
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest());

	const { data: requisitionResponse, isLoading: isLoadingRequisition } = useGetRequisitionByIdQuery(requisitionId);
	const [updateRequisition] = useUpdateRequisitionMutation();

	const { purchaseProducts: itemsProducts, refetch } = useTempPurchaseProducts({ type: "requisition" });
	const [isAddingItem, setIsAddingItem] = useState(false);
	const [isEditInitialized, setIsEditInitialized] = useState(false);
	const warehouseIdRef = useRef(null);

	const requisition = requisitionResponse?.data;

	// =============== clear temp items and populate from API response ===============
	useEffect(() => {
		if (!requisition || isEditInitialized) return;

		const populateTempTable = async () => {
			// =============== clear any existing temp requisition items first ===============
			await window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "requisition" });

			const items = requisition.requisition_items || [];
			for (const item of items) {
				await window.dbAPI.upsertIntoTable("temp_purchase_products", {
					product_id: item.product_id,
					display_name: item.display_name,
					quantity: Number(item.quantity) || 0,
					purchase_price: Number(item.purchase_price) || 0,
					sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
					sub_total: Number(item.sub_total) || 0,
					unit_name: item.unit_name ?? "",
					warehouse_id: item.warehouse_id ?? null,
					type: "requisition",
				});
			}

			refetch();

			// =============== parse dates from dd-mm-yyyy to Date objects ===============
			const parseDate = (dateStr) => {
				if (!dateStr) return null;
				const parts = dateStr.split("-");
				if (parts.length === 3) {
					return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
				}
				return new Date(dateStr);
			};

			itemsForm.setValues({
				vendor_id: requisition.vendor_id ? String(requisition.vendor_id) : "",
				vendorName: requisition.vendor_name ?? "",
				vendorPhone: requisition.vendor_mobile ?? "+880",
				vendorEmail: "",
				purchaseNarration: requisition.remark ?? "",
				invoice_date: parseDate(requisition.invoice_date),
				expected_date: parseDate(requisition.expected_date),
				transactionModeId: "placeholder",
				discountAmount: 0,
				isDiscountPercentage: false,
				paymentAmount: 0,
			});

			warehouseIdRef.current = requisition.warehouse_id ?? null;
			setIsEditInitialized(true);
		};

		populateTempTable();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [requisition]);

	// =============== cleanup temp items when leaving edit page ===============
	useEffect(() => {
		return () => {
			window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "requisition" });
		};
	}, []);

	const handleSubmit = async (formValues) => {
		if (!itemsProducts?.length) {
			showNotification("Add minimum one requisition item first", "red");
			return;
		}

		if (!formValues.vendor_id) {
			showNotification("Vendor is required", "red");
			return;
		}

		const requisitionItemsForPayload = itemsProducts.map((item) => ({
			product_id: item.product_id,
			display_name: item.display_name,
			unit_name: item.unit_name ?? "",
			quantity: Number(item.quantity) || 0,
			purchase_price: Number(item.purchase_price) || 0,
			sales_price: Number(item.sales_price) || Number(item.purchase_price) || 0,
			sub_total: (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
		}));

		const payload = {
			id: Number(requisitionId),
			invoice_date: formValues.invoice_date ? formatDateISO(formValues.invoice_date) : null,
			expected_date: formValues.expected_date ? formatDateISO(formValues.expected_date) : null,
			remark: formValues.purchaseNarration || null,
			created_by_id: user?.id ?? null,
			items: requisitionItemsForPayload,
			process: requisition?.process ?? "Created",
			vendor_id: formValues.vendor_id ? String(formValues.vendor_id) : null,
			warehouse_id: warehouseIdRef.current,
		};

		setIsAddingItem(true);
		try {
			const res = await updateRequisition(payload).unwrap();

			if (res.data || res.status === 200) {
				showNotification("Requisition updated successfully", "teal");

				await window.dbAPI.deleteDataFromTable("temp_purchase_products", { type: "requisition" });
				navigate(APP_NAVLINKS.REQUISITION);
			} else {
				showNotification("Failed to update requisition", "red");
			}
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to update requisition", "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	if (isLoadingRequisition) {
		return <RequisitionEditSkeleton />;
	}

	if (!requisition && !isLoadingRequisition) {
		return (
			<Center h={300}>
				<Text c="dimmed">Requisition not found.</Text>
			</Center>
		);
	}

	return (
		<Grid columns={24} gutter={0}>
			<Grid.Col span={6}>
				<Box p="xs" pr={0}>
					<InvoiceForm refetch={refetch} />
				</Box>
			</Grid.Col>
			<Grid.Col span={18}>
				<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
					<PurchaseOverview
						isAddingItem={isAddingItem}
						itemsForm={itemsForm}
						itemsProducts={itemsProducts}
						refetch={refetch}
						isEditMode={true}
					/>
				</Box>
			</Grid.Col>
		</Grid>
	);
}
