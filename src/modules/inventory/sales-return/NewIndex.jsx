import { useState, useRef } from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import InvoiceForm from "./form/InvoiceForm";
import PurchaseCardsPanel from "./PurchaseCardsPanel";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { useAddPurchaseReturnMutation, useGetVendorWisePurchaseItemsQuery } from "@services/purchase-return";
import { useTranslation } from "react-i18next";

export default function NewIndex() {
	const { t } = useTranslation();
	const { user } = useLoggedInUser();
	const itemsForm = useForm(vendorOverviewRequest(t));
	const [ purchaseItems, setPurchaseItems ] = useState([]);
	const [ isAddingItem, setIsAddingItem ] = useState(false);
	const [ selectedReturnMode, setSelectedReturnMode ] = useState(null);
	const [ selectedVendorId, setSelectedVendorId ] = useState(null);
	const [ selectedPurchaseId, setSelectedPurchaseId ] = useState(null);
	const itemIdCounter = useRef(0);
	const [ addPurchaseReturn ] = useAddPurchaseReturnMutation();

	const { data: vendorWisePurchaseItems } = useGetVendorWisePurchaseItemsQuery();

	// =============== build vendor options from api response ===============
	const vendorOptions =
		vendorWisePurchaseItems?.data?.map((vendor) => ({
			value: String(vendor.vendor_id),
			label: vendor.vendor_name,
		})) ?? [];

	// =============== find selected vendor object in api data ===============
	const selectedVendorData = vendorWisePurchaseItems?.data?.find(
		(vendor) => String(vendor.vendor_id) === selectedVendorId
	);

	// =============== filter purchases by return mode (requisition flag) ===============
	const filteredPurchases =
		selectedVendorData?.purchases?.filter((purchase) => {
			if (selectedReturnMode === "Requisition") return purchase.is_requisition === 1;
			if (selectedReturnMode === "General") return !purchase.is_requisition;
			return true;
		}) ?? [];

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

	const handleReturnModeChange = (value) => {
		setSelectedReturnMode(value);
		setSelectedVendorId(null);
		setSelectedPurchaseId(null);
		setPurchaseItems([]);
		itemIdCounter.current = 0;
		itemsForm.setFieldValue("vendor_id", "");
	};

	const handleVendorChange = (vendorId) => {
		setSelectedVendorId(vendorId ?? null);
		setSelectedPurchaseId(null);
		setPurchaseItems([]);
		itemIdCounter.current = 0;
		itemsForm.setFieldValue("vendor_id", vendorId ?? "");
	};

	// =============== clicking a purchase card replaces the items table with all items from that purchase ===============
	const handlePurchaseCardClick = (purchase) => {
		setSelectedPurchaseId(String(purchase.id));
		itemIdCounter.current = 0;

		const newItems = (purchase.items ?? []).map((purchaseItem) => {
			itemIdCounter.current += 1;
			return {
				id: itemIdCounter.current,
				display_name: purchaseItem.item_name,
				quantity: purchaseItem.purchase_quantity,
				purchase_price: purchaseItem.purchase_price,
				purchase_quantity: purchaseItem.purchase_quantity,
				sub_total: purchaseItem.purchase_quantity * purchaseItem.purchase_price,
				unit_name: purchaseItem.unit_name ?? "",
				purchase_item_id: purchaseItem.id,
			};
		});

		setPurchaseItems(newItems);
	};

	const handleSubmit = async (formValues) => {
		if (!purchaseItems.length) {
			showNotification(t("AddMinimumOnePurchaseItemFirst"), "red");
			return;
		}

		if (!formValues.vendor_id) {
			showNotification(t("VendorRequired"), "red");
			return;
		}

		if (!selectedReturnMode) {
			showNotification(t("ReturnTypeRequired"), "red");
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
				sub_total: (Number(item.quantity) || 0) * (Number(item.purchase_price) || 0),
			})),
			narration: formValues.purchaseNarration ?? "",
			return_type: selectedReturnMode,
		};

		setIsAddingItem(true);
		try {
			await addPurchaseReturn(payload).unwrap();

			showNotification(t("PurchaseReturnSavedSuccessfully"), "teal");
			setPurchaseItems([]);
			itemIdCounter.current = 0;
			setSelectedReturnMode(null);
			setSelectedVendorId(null);
			setSelectedPurchaseId(null);
			itemsForm.reset();
		} catch (error) {
			console.error(error);
			showNotification(error?.message || t("FailedToSavePurchaseReturn"), "red");
		} finally {
			setIsAddingItem(false);
		}
	};

	return (
		<Box p="xs" bg="var(--mantine-color-gray-1)">
			<Grid columns={24} gutter={0}>
				<Grid.Col span={5}>
					<Box>
						<InvoiceForm
							vendorOptions={vendorOptions}
							selectedReturnMode={selectedReturnMode}
							selectedVendorId={selectedVendorId}
							onReturnTypeChange={handleReturnModeChange}
							onVendorChange={handleVendorChange}
						/>
					</Box>
				</Grid.Col>
				<Grid.Col span={5} pl="xs">
					<PurchaseCardsPanel
						filteredPurchases={filteredPurchases}
						selectedPurchaseId={selectedPurchaseId}
						selectedReturnMode={selectedReturnMode}
						selectedVendorId={selectedVendorId}
						onPurchaseCardClick={handlePurchaseCardClick}
					/>
				</Grid.Col>
				<Grid.Col span={14}>
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
		</Box>
	);
}
