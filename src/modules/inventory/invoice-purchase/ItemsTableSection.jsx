import { ActionIcon, Box, Flex, NumberInput, Text, Button, Badge } from "@mantine/core";
import { MonthPickerInput } from "@mantine/dates";
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

export default function ItemsTableSection({
	itemsProducts,
	refetch,
	itemsTotal,
	onQuantityChange,
	onRemoveItem,
	onMrpChange,
	onBonusQuantityChange,
	onExpiredDateChange,
}) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const tableHeight = mainAreaHeight - 286;
	const { currencySymbol } = useConfigData();

	const handleQuantityChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const newSubTotal = numericValue * (currentItem?.mrp || 0);
		const updatedData = { quantity: numericValue, sub_total: newSubTotal };
		if (onQuantityChange) {
			onQuantityChange(itemId, updatedData);
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
		const updatedData = { expired_date: dateValue };
		if (onExpiredDateChange) {
			onExpiredDateChange(itemId, updatedData);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", { id: itemId, ...updatedData });
			refetch();
		}
	};

	const handleMrpChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const updatedData = { mrp: numericValue };
		if (onMrpChange) {
			onMrpChange(itemId, updatedData);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", { id: itemId, ...updatedData });
			refetch();
		}
	};

	const handleBonusQuantityChange = async (itemId, value) => {
		const numericValue = parseFloat(value) || 0;
		const updatedData = { bonus_quantity: numericValue };
		if (onBonusQuantityChange) {
			onBonusQuantityChange(itemId, updatedData);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", { id: itemId, ...updatedData });
			refetch();
		}
	};

	return (
		<Box bg="gray.1" >

			<Flex justify="space-between" align="center" mb="4xs">
				<Box px="xs" fz="sm" fw={600} className="boxBackground textColor">
					{t("InvoicePurchase")}
				</Box>
				<Box>
					<Button
						onClick={() => navigate(APP_NAVLINKS.PURCHASE)}
						bg="red"
						size="xs"
						color="white"
						leftSection={<IconList size={18} />}
					>
						{t("Purchase")}
					</Button>
				</Box>
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
						width: 50,
						render: (_, index) => index + 1,
					},
					{
						accessor: "display_name",
						title: t("Name"),
						render: (record) => <Text size="xs">{record.display_name}</Text>,
					},
					{
						accessor: "average_price",
						title: t("AVGPP"),
						textAlign: "center",
						width: 90,
						render: (record) => (
							<Text size="xs" c="dimmed">
								{formatCurrency(record.average_price ?? 0)}
							</Text>
						),
					},
					{
						accessor: "expired_date",
						title: t("Expiry"),
						textAlign: "center",
						width: 130,
						render: (record) => (
							<MonthPickerInput
								size="xs"
								value={record.expired_date ? new Date(record.expired_date) : null}
								placeholder="MM-YYYY"
								valueFormat="MM-YYYY"
								clearable
								onChange={(dateValue) => handleExpiredDateChange(record.id, dateValue)}
							/>
						),
					},
					{
						accessor: "mrp",
						title: "MRP",
						textAlign: "center",
						width: 100,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.mrp ?? 0}
								min={0}
								step={1}
								decimalScale={2}
								hideControls
								onChange={(value) => handleMrpChange(record.id, value)}
							/>
						),
					},
					{
						accessor: "quantity",
						title: "QTY",
						textAlign: "left",
						width: 100,
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
						accessor: "bonus_quantity",
						title: t("BonusQty"),
						textAlign: "left",
						width: 110,
						render: (record) => (
							<NumberInput
								size="xs"
								value={record.bonus_quantity ?? 0}
								min={0}
								step={1}
								hideControls
								onChange={(value) => handleBonusQuantityChange(record.id, value)}
							/>
						),
					},
					{
						accessor: "subTotal",
						title: t("Total"),
						textAlign: "right",
						width: 100,
						render: (record) => {
							const subTotal = (record.quantity || 0) * (record.mrp || 0);
							return (
								<Text size="xs" fw={600}>
									{currencySymbol} {formatCurrency(subTotal)}
								</Text>
							);
						},
					},
					{
						accessor: "action",
						title: "",
						textAlign: "center",
						width: 50,
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
