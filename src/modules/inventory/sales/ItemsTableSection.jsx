import React from "react";
import { ActionIcon, Box, Flex, NumberInput, Text, Button } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { IconList, IconTrashX } from "@tabler/icons-react";
import tableCss from "@assets/css/Table.module.css";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";
import { useNavigate } from "react-router";
import { APP_NAVLINKS } from "@/routes/routes";
import { useTranslation } from "react-i18next";

export default function ItemsTableSection({ salesProducts, refetch, itemsTotal }) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	// =============== account for invoice form top row (~55px) + payment section + spacing ===============
	const tableHeight = mainAreaHeight - 460;
	const { configData } = useConfigData();

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const handleQuantityChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const currentItem = salesProducts.find((item) => item.id === itemId);
		const newSubTotal = numericValue * (currentItem?.sales_price || 0);
		await window.dbAPI.upsertIntoTable("temp_sales_products", {
			id: itemId,
			quantity: numericValue,
			sub_total: newSubTotal,
		});
		refetch();
	};

	const handlePriceChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const currentItem = salesProducts.find((item) => item.id === itemId);
		const newSubTotal = (currentItem?.quantity || 0) * numericValue;
		await window.dbAPI.upsertIntoTable("temp_sales_products", {
			id: itemId,
			sales_price: numericValue,
			sub_total: newSubTotal,
		});
		refetch();
	};

	const handleRemoveItem = async (itemId) => {
		await window.dbAPI.deleteDataFromTable("temp_sales_products", itemId);
		refetch();
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
				records={salesProducts}
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
						accessor: "quantity",
						title: "Qty",
						textAlign: "center",
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
						accessor: "sales_price",
						title: "Price",
						textAlign: "right",
						width: 140,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.sales_price}
								min={0}
								step={1}
								hideControls
								thousandSeparator=","
								onChange={(value) => handlePriceChange(record.id, value)}
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

			<Box mt="les" px="xs" py="4xs" bg="var(--theme-tertiary-color-2)" className="borderRadiusAll">
				<Flex justify="space-between" align="center">
					<Text fz="sm" fw={600}>
						Σ&nbsp; {salesProducts.length} Item(s)
					</Text>
					<Flex align="center" gap={4}>
						<Text fz="sm" fw={500}>
							{currencySymbol}
						</Text>
						<Text fz="sm" fw={700}>
							{formatCurrency(itemsTotal)}
						</Text>
					</Flex>
				</Flex>
			</Box>
		</Box>
	);
}
