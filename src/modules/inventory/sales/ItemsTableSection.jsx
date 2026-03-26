import React from "react";
import { ActionIcon, Badge, Box, Flex, NumberInput, Text } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { IconTrashX } from "@tabler/icons-react";
import tableCss from "@assets/css/Table.module.css";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";

export default function ItemsTableSection({
	itemsProducts,
	refetch,
	itemsTotal,
	onQuantityChange,
	onPriceChange,
	onDiscountChange,
	onRemoveItem,
}) {
	const { mainAreaHeight } = useMainAreaHeight();
	// =============== account for invoice form top row (~55px) + payment section + spacing ===============

	const tableHeight = mainAreaHeight - 342;
	const { currencySymbol } = useConfigData();

	const handleQuantityChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const newSubTotal = numericValue * (currentItem?.sales_price || 0);
		const updatedData = { quantity: numericValue, sub_total: newSubTotal };

		if (onQuantityChange) {
			onQuantityChange(itemId, updatedData);
		} else {
			await window.dbAPI.updateDataInTable("temp_sales_products", {
				id: itemId,
				data: updatedData,
			});
			refetch();
		}
	};

	const handlePriceChange = async (itemId, value) => {
		const effectivePrice = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const basePrice = Number(currentItem?.price) || Number(currentItem?.sales_price) || 0;
		const newSubTotal = (currentItem?.quantity || 0) * effectivePrice;
		// =============== derive percent from effective price; if base is 0, set price = effectivePrice ===============
		const percentValue = basePrice > 0 ? Math.round((1 - effectivePrice / basePrice) * 100) : 0;
		const updatedData = {
			sales_price: effectivePrice,
			percent: Math.max(0, percentValue),
			sub_total: newSubTotal,
		};
		if (basePrice <= 0) {
			updatedData.price = effectivePrice;
		}

		if (onPriceChange) {
			onPriceChange(itemId, updatedData);
		} else {
			await window.dbAPI.updateDataInTable("temp_sales_products", {
				id: itemId,
				data: updatedData,
			});
			refetch();
		}
	};

	const handleDiscountChange = async (itemId, value) => {
		const percentValue = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const basePrice = Number(currentItem?.price) || Number(currentItem?.sales_price) || 0;
		const effectivePrice = basePrice * (1 - percentValue / 100);
		const newSubTotal = (currentItem?.quantity || 0) * effectivePrice;
		const updatedData = {
			percent: percentValue,
			sales_price: effectivePrice,
			sub_total: newSubTotal,
		};

		if (onDiscountChange) {
			onDiscountChange(itemId, updatedData);
		} else {
			await window.dbAPI.updateDataInTable("temp_sales_products", {
				id: itemId,
				data: updatedData,
			});
			refetch();
		}
	};

	const handleRemoveItem = async (itemId) => {
		if (onRemoveItem) {
			onRemoveItem(itemId);
		} else {
			await window.dbAPI.deleteDataFromTable("temp_sales_products", itemId);
			refetch();
		}
	};

	return (
		<Box bd="1px solid #dee2e6" bg="white" p="3xs" className="borderRadiusAll">
			<DataTable
				classNames={{
					root: tableCss.root,
					table: tableCss.table,
					header: tableCss.header,
					footer: tableCss.footer,
					pagination: tableCss.pagination,
				}}
				styles={{
					table: {
						border: "1px solid #dee2e6",
					},
				}}
				withColumnBorders={true}
				records={itemsProducts}
				columns={[
					{
						accessor: "serial",
						title: "S/N",
						width: 60,
						render: (_, index) => index + 1,
					},
					{
						accessor: "display_name",
						title: "Product",
						render: (record) => <Text size="sm">{record.display_name}</Text>,
					},
					{
						accessor: "category_name",
						title: "Category",
						textAlign: "center",
						render: (record) => (
							<Text size="sm" c="dimmed">
								{record.category_name || "—"}
							</Text>
						),
					},
					{
						accessor: "mrp",
						title: "MRP",
						textAlign: "center",
						width: 100,
						render: (record) => (
							<Text size="sm" c="dimmed">
								<Badge
									variant="light"
									color={record?.average_price > record?.mrp ? "red" : "blue"}
									radius="sm">
									{currencySymbol} {formatCurrency(record?.mrp ?? 0)}
								</Badge>
							</Text>
						),
					},
					{
						accessor: "average_price",
						title: "Avg. Price",
						textAlign: "center",
						width: 120,
						render: (record) => (
							<Text size="sm" c="dimmed">
								{currencySymbol} {formatCurrency(record?.average_price ?? 0)}
							</Text>
						),
					},
					{
						accessor: "quantity",
						title: "Qty",
						textAlign: "left",
						width: 120,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.quantity}
								min={0}
								step={1}
								hideControls
								onChange={(value) => handleQuantityChange(record.id, value)}
							/>
						),
					},
					{
						accessor: "stock",
						title: "Stock",
						textAlign: "center",
						width: 110,
						render: (record) => (
							<Text size="sm" c="dimmed">
								<Badge
									variant="light"
									color={record.stock < 0 ? "red" : "blue"}
									radius="sm">
									{record.stock ?? 0} {record.unit_name || ""}
								</Badge>
							</Text>
						),
					},
					{
						accessor: "sales_price",
						title: "Price",
						textAlign: "left",
						width: 140,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.sales_price}
								min={0}
								step={1}
								decimalScale={2}
								hideControls
								thousandSeparator=","
								onChange={(value) => handlePriceChange(record.id, value)}
							/>
						),
					},

					{
						accessor: "percent",
						title: "Discount (%)",
						textAlign: "center",
						width: 110,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.percent ?? 0}
								min={0}
								max={100}
								clampBehavior="strict"
								step={1}
								hideControls
								suffix="%"
								onChange={(value) => handleDiscountChange(record.id, value)}
							/>
						),
					},
					{
						accessor: "sub_total",
						title: "Sub Total",
						textAlign: "right",
						width: 160,
						render: (record) => {
							const subTotal = (record.quantity || 0) * (record.sales_price || 0);
							return (
								<Text size="sm" fw={600}>
									{currencySymbol} {formatCurrency(subTotal)}
								</Text>
							);
						},
					},
					{
						accessor: "action",
						title: "",
						textAlign: "center",
						width: 60,
						render: (record) => (
							<ActionIcon
								size="sm"
								variant="light"
								color="var(--theme-delete-color)"
								radius="sm"
								onClick={() => handleRemoveItem(record.id)}
							>
								<IconTrashX size={16} />
							</ActionIcon>
						),
					},
				]}
				height={tableHeight}
				scrollAreaProps={{ type: "never" }}
				noRecordsText="No items added"
			/>

			<Box mt="les" px="xs" py="xs" bg="gray.1" className="borderRadiusAll">
				<Flex justify="space-between" align="center">
					<Badge size="xl" bg={"red"}>
						<Text fz="sm" fw={600}>
							Σ&nbsp; {itemsProducts.length} Item(s)
						</Text>
					</Badge>
					<Flex align="center" gap={4}>
						<Badge size="xl" radius="sm" bg="#1e40af">
							<Text fz="xl" fw={700}>
								{currencySymbol}&nbsp;{formatCurrency(itemsTotal)}
							</Text>
						</Badge>
					</Flex>
				</Flex>
			</Box>
		</Box>
	);
}
