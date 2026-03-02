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

export default function ItemsTableSection({ purchaseForm, itemsTotal }) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const tableHeight = mainAreaHeight - 394;
	const { configData } = useConfigData();

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const purchaseItems = purchaseForm.values.items || [];

	const handleQuantityChange = (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const updatedItems = purchaseItems.map((item) =>
			item.id === itemId ? { ...item, quantity: numericValue } : item
		);
		purchaseForm.setFieldValue("items", updatedItems);
	};

	const handlePriceChange = (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const updatedItems = purchaseItems.map((item) =>
			item.id === itemId ? { ...item, price: numericValue } : item
		);
		purchaseForm.setFieldValue("items", updatedItems);
	};

	const handleRemoveItem = (itemId) => {
		const updatedItems = purchaseItems.filter((item) => item.id !== itemId);
		purchaseForm.setFieldValue("items", updatedItems);
	};

	return (
		<Box bd="1px solid #dee2e6" bg="white" p="3xs" className="borderRadiusAll">
			<Flex justify="space-between" align="center" mb="4xs">
				<Box px="xs" fz="sm" fw={600} className="boxBackground textColor borderRadiusAll">
					{t("PurchaseItems")}
				</Box>

				<Button
					onClick={() => navigate(APP_NAVLINKS.PURCHASE)}
					w={170}
					bg="var(--theme-primary-color-6)"
					color="white"
					leftSection={<IconList size={18} />}
				>
					{t("PurchaseList")}
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
				records={purchaseItems}
				columns={[
					{
						accessor: "serial",
						title: "S/N",
						width: 60,
						render: (_, index) => index + 1,
					},
					{
						accessor: "productName",
						title: "Product",
						render: (record) => <Text size="sm">{record.productName}</Text>,
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
						accessor: "price",
						title: "Price",
						textAlign: "right",
						width: 140,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.price}
								min={0}
								step={1}
								hideControls
								thousandSeparator=","
								onChange={(value) => handlePriceChange(record.id, value)}
							/>
						),
					},
					{
						accessor: "subTotal",
						title: "Sub Total",
						textAlign: "right",
						width: 160,
						render: (record) => {
							const subTotal = (record.quantity || 0) * (record.price || 0);
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
						Σ&nbsp; {purchaseItems.length} Item(s)
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
