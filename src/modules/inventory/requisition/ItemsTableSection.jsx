import React from "react";
import { ActionIcon, Box, Flex, NumberInput, Text, Button, Badge } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { DataTable } from "mantine-datatable";
import { IconList, IconTrashX } from "@tabler/icons-react";
import tableCss from "@assets/css/Table.module.css";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";

import { useNavigate } from "react-router";
import { APP_NAVLINKS } from "@/routes/routes";
import { useTranslation } from "react-i18next";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";

dayjs.extend(customParseFormat);

export default function ItemsTableSection({ itemsProducts, refetch, itemsTotal, onQuantityChange, onPriceChange, onRemoveItem }) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const tableHeight = mainAreaHeight - 220;
	const { currencySymbol } = useConfigData();

	const handleQuantityChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const newSubTotal = numericValue * (currentItem?.purchase_price || 0);
		const updatedData = { quantity: numericValue, sub_total: newSubTotal };
		if (onQuantityChange) {
			onQuantityChange(itemId, updatedData);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", { id: itemId, ...updatedData });
			refetch();
		}
	};

	const handlePriceChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const newSubTotal = (currentItem?.quantity || 0) * numericValue;
		const updatedData = { purchase_price: numericValue, sub_total: newSubTotal };
		if (onPriceChange) {
			onPriceChange(itemId, updatedData);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", { id: itemId, ...updatedData });
			refetch();
		}
	};

	const handleRemoveItem = async (itemId) => {
		if (onRemoveItem) {
			onRemoveItem(itemId);
		} else {
			await window.dbAPI.deleteDataFromTable("temp_purchase_products", itemId);
			refetch();
		}
	};

	const handleExpiredDateChange = async (itemId, value) => {
		const dateValue = value ? dayjs(value).format("YYYY-MM-DD") : null;
		await window.dbAPI.upsertIntoTable("temp_purchase_products", {
			id: itemId,
			expired_date: dateValue,
		});
		refetch();
	};

	return (
		<Box bg="gray.1" >
			<Flex justify="space-between" align="center" mb="4xs">
				<Box px="xs" fz="sm" fw={600} className="boxBackground textColor">
					{t("RequisitionItems")}
				</Box>
				<Button
					onClick={() => navigate(APP_NAVLINKS.REQUISITION)}
					bg="red"
					color="white"
					leftSection={<IconList size={18} />}
				>
					{t("Requisition")}
				</Button>
			</Flex>

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
						accessor: "price",
						title: "Price",
						textAlign: "left",
						width: 140,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.purchase_price ?? 0}
								min={0}
								step={1}
								hideControls
								thousandSeparator=","
								onChange={(value) => handlePriceChange(record.id, value)}
							/>
						),
					},
					{
						accessor: "quantity",
						title: "Quantity",
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
						accessor: "subTotal",
						title: "Sub Total",
						textAlign: "right",
						width: 120,
						render: (record) => {
							const subTotal = (record.quantity || 0) * (record.purchase_price || 0);
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

			<Box mt="les" px="xs" py="4xs" bg="var(--theme-tertiary-color-2)" className="borderRadiusAll">
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
