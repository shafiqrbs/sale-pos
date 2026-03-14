import {
	Box,
	Button,
	Divider,
	Flex,
	ScrollArea,
	Select,
	Text,
	ActionIcon,
	NumberInput,
	Stack,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { showNotification } from "@components/ShowNotificationComponent";
import { useGetVendorWisePurchaseItemsQuery } from "@services/purchase-return";
import { useTranslation } from "react-i18next";
import React, { useState } from "react";

export default function InvoiceForm({ onAddItem, onReturnTypeChange, onVendorChange }) {
	const { data: vendorWisePurchaseItems } = useGetVendorWisePurchaseItemsQuery();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();

	const [ selectedReturnMode, setSelectedReturnMode ] = useState(null);
	const [ selectedVendorId, setSelectedVendorId ] = useState(null);
	const [ selectedPurchaseId, setSelectedPurchaseId ] = useState(null);
	const [ itemReturnQuantities, setItemReturnQuantities ] = useState({});

	const containerHeight = mainAreaHeight - 120;

	// =============== build vendor options from vendorWisePurchaseItems data ===============
	const vendorOptions =
		vendorWisePurchaseItems?.data?.map((vendor) => ({
			value: String(vendor.vendor_id),
			label: vendor.vendor_name,
		})) ?? [];

	// =============== find selected vendor object ===============
	const selectedVendorData = vendorWisePurchaseItems?.data?.find(
		(vendor) => String(vendor.vendor_id) === selectedVendorId
	);

	// =============== filter purchases by return mode (general = no requisition, requisition = is_requisition:1) ===============
	const filteredPurchases =
		selectedVendorData?.purchases?.filter((purchase) => {
			if (selectedReturnMode === "Requisition") return purchase.is_requisition === 1;
			if (selectedReturnMode === "General") return !purchase.is_requisition;
			return true;
		}) ?? [];

	const purchaseOptions = filteredPurchases.map((purchase) => ({
		value: String(purchase.id),
		label: `${purchase.invoice} — ${purchase.created} — ${purchase.total}`,
	}));

	// =============== get items from the selected purchase ===============
	const selectedPurchaseData = filteredPurchases.find(
		(purchase) => String(purchase.id) === selectedPurchaseId
	);
	const selectedPurchaseItems = selectedPurchaseData?.items ?? [];

	const handleAddSingleItem = (purchaseItem) => {
		const returnQuantity = itemReturnQuantities[ purchaseItem.id ] || 0;
		if (returnQuantity <= 0) {
			showNotification("Enter return quantity first", "red");
			return;
		}

		onAddItem({
			display_name: purchaseItem.item_name,
			quantity: returnQuantity,
			purchase_price: purchaseItem.purchase_price,
			purchase_quantity: purchaseItem.purchase_quantity,
			sub_total: returnQuantity * purchaseItem.purchase_price,
			unit_name: purchaseItem.unit_name,
			// =============== purchase item id used as unique key for dedup in parent state ===============
			purchase_item_id: purchaseItem.id,
		});

		showNotification(`${purchaseItem.item_name} added`, "teal");
	};

	const handleAddAllItems = () => {
		const itemsWithQuantity = selectedPurchaseItems.filter(
			(item) => (itemReturnQuantities[ item.id ] || 0) > 0
		);

		if (!itemsWithQuantity.length) {
			showNotification("Enter return quantity for at least one item", "red");
			return;
		}

		for (const item of itemsWithQuantity) {
			onAddItem({
				display_name: item.item_name,
				quantity: itemReturnQuantities[ item.id ],
				purchase_price: item.purchase_price,
				purchase_quantity: item.purchase_quantity,
				sub_total: itemReturnQuantities[ item.id ] * item.purchase_price,
				unit_name: item.unit_name,
				// =============== purchase item id used as unique key for dedup in parent state ===============
				purchase_item_id: item.id,
			});
		}

		showNotification("All items added successfully", "teal");
	};

	const handleReturnModeChange = (value) => {
		setSelectedReturnMode(value);
		setSelectedVendorId(null);
		setSelectedPurchaseId(null);
		setItemReturnQuantities({});
		onReturnTypeChange?.(value);
		onVendorChange?.(null);
	};

	const handleVendorChange = (value) => {
		setSelectedVendorId(value);
		setSelectedPurchaseId(null);
		setItemReturnQuantities({});
		onVendorChange?.(value);
	};

	const handlePurchaseChange = (value) => {
		setSelectedPurchaseId(value);
		setItemReturnQuantities({});
	};

	const handleItemQuantityChange = (itemId, value) => {
		setItemReturnQuantities((previous) => ({
			...previous,
			[ itemId ]: value,
		}));
	};

	return (
		<Box bd="1px solid #dee2e6" bg="white" className="borderRadiusAll">
			<Box
				p="sm"
				fz="sm"
				fw={600}
				bg={"var(--theme-primary-color-8)"}
				c={"white"}
				className="boxBackground textColor borderRadiusAll"
			>
				{t("PurchaseReturn")}
			</Box>
			<Divider />
			<ScrollArea h={containerHeight} bg={"#f0f4f83d"} type="never">
				<Box p="sm">
					<Box mt="xs">
						<Select
							placeholder="Choose return type"
							data={[ "General", "Requisition" ]}
							value={selectedReturnMode}
							onChange={handleReturnModeChange}
							clearable
							searchable
						/>
					</Box>
					<Box mt="xs">
						<Select
							placeholder="Vendor"
							data={vendorOptions}
							value={selectedVendorId}
							onChange={handleVendorChange}
							clearable
							searchable
							disabled={!selectedReturnMode}
						/>
					</Box>
					<Box mt="xs">
						<Select
							placeholder="Purchase"
							data={purchaseOptions}
							value={selectedPurchaseId}
							onChange={handlePurchaseChange}
							clearable
							searchable
							disabled={!selectedVendorId}
						/>
					</Box>

					{/* =============== items list from selected purchase with return quantity inputs =============== */}
					<Box mt="xs">
						<Flex
							px="xs"
							py="4xs"
							bg="var(--theme-primary-color-6)"
							justify="space-between"
						>
							<Text fz="xs" fw={600} c="white">
								Product
							</Text>
							<Text fz="xs" fw={600} c="white">
								Quantity / Price / UOM
							</Text>
						</Flex>

						{selectedPurchaseItems.length === 0 ? (
							<Box py="xl" ta="center">
								<Text fz="sm" c="dimmed">
									No records
								</Text>
							</Box>
						) : (
							<Stack gap={0}>
								{selectedPurchaseItems.map((item, index) => (
									<Flex
										key={item.id}
										align="center"
										gap={4}
										py="4xs"
										px="xs"
										style={{ borderBottom: "1px solid #dee2e6" }}
									>
										<Text
											fz="xs"
											flex={1}
											style={{
												whiteSpace: "nowrap",
												overflow: "hidden",
												textOverflow: "ellipsis",
											}}
										>
											{index + 1}. {item.item_name}
										</Text>
										<NumberInput
											size="xs"
											w={50}
											value={item.purchase_quantity}
											readOnly
											hideControls
											styles={{
												input: {
													backgroundColor: "#fefce8",
													textAlign: "center",
												},
											}}
										/>
										<NumberInput
											size="xs"
											w={50}
											value={item.purchase_price}
											readOnly
											hideControls
											styles={{
												input: {
													backgroundColor: "#fefce8",
													textAlign: "center",
												},
											}}
										/>
										<Text fz="xs" w={30} ta="center">
											{item.unit_name}
										</Text>
										<NumberInput
											size="xs"
											w={55}
											min={0}
											value={itemReturnQuantities[ item.id ] ?? ""}
											onChange={(value) =>
												handleItemQuantityChange(item.id, value)
											}
											hideControls
											placeholder="Qty"
										/>
										<ActionIcon
											size="sm"
											bg="var(--theme-primary-color-6)"
											color="white"
											radius="xl"
											onClick={() => handleAddSingleItem(item)}
										>
											<IconPlus size={14} />
										</ActionIcon>
									</Flex>
								))}
							</Stack>
						)}
					</Box>
				</Box>
			</ScrollArea>
			<Flex p="sm" justify="space-between" align="center" bg={"#fffbeb85"}>
				<Button
					fullWidth
					leftSection={<IconPlus size={18} />}
					bg="var(--theme-primary-color-6)"
					color="white"
					radius="sm"
					onClick={handleAddAllItems}
					id="EntityFormSubmit"
				>
					Add All
				</Button>
			</Flex>
		</Box>
	);
}
