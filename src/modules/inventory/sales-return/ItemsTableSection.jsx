import { ActionIcon, Box, Flex, NumberInput, Text, Button, Badge, Group } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { IconList, IconTrashX } from "@tabler/icons-react";
import tableCss from "@assets/css/Table.module.css";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";
import { useNavigate } from "react-router";
import { APP_NAVLINKS } from "@/routes/routes";
import { useTranslation } from "react-i18next";

export default function ItemsTableSection({ itemsProducts, itemsTotal, onItemUpdate, onRemoveItem }) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const tableHeight = mainAreaHeight - 206;
	const { currencySymbol } = useConfigData();

	const handleStockQuantityChange = (itemId, value) => {
		const stockQuantity = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const damageQuantity = currentItem?.damage_quantity || 0;
		const salesQuantity = currentItem?.sales_quantity || 0;

		// =============== clamp so stock + damage never exceeds sales quantity ===============
		const clampedStock = Math.min(stockQuantity, Math.max(0, salesQuantity - damageQuantity));
		const subTotal = (clampedStock + damageQuantity) * (currentItem?.sales_price || 0);
		onItemUpdate(itemId, { stock_quantity: clampedStock, sub_total: subTotal });
	};

	const handleDamageQuantityChange = (itemId, value) => {
		const damageQuantity = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const stockQuantity = currentItem?.stock_quantity || 0;
		const salesQuantity = currentItem?.sales_quantity || 0;

		// =============== clamp so stock + damage never exceeds sales quantity ===============
		const clampedDamage = Math.min(damageQuantity, Math.max(0, salesQuantity - stockQuantity));
		const subTotal = (stockQuantity + clampedDamage) * (currentItem?.sales_price || 0);
		onItemUpdate(itemId, { damage_quantity: clampedDamage, sub_total: subTotal });
	};

	const handleRemoveItem = (itemId) => {
		onRemoveItem(itemId);
	};

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<Box px="xs" fz="sm" fw={600} className="textColor">
					{t("SalesReturnItems")}
				</Box>
				<Group gap="sm" wrap="nowrap">
					<Button
						size="xs"
						color="red"
						variant="filled"
						leftSection={<IconList size={20} />}
						onClick={() => navigate(APP_NAVLINKS.SALES_RETURN)}
					>
						{t("SalesReturn")}
					</Button>
				</Group>
			</Flex>
			<Box pl="xs">
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
							render: (record) => <Text size="sm">{record.display_name || "empty"}</Text>,
						},
						{
							accessor: "unit_name",
							title: t("UOM"),
							textAlign: "center",
							width: 70,
							render: (record) => (
								<Text size="sm" c="dimmed">
									{record.unit_name || record.uom || "—"}
								</Text>
							),
						},
						{
							accessor: "sales_quantity",
							title: t("SalesQty"),
							textAlign: "center",
							width: 90,
							render: (record) => (
								<Text size="sm" c="dimmed">
									{record.sales_quantity ?? "—"}
								</Text>
							),
						},
						{
							accessor: "stock_quantity",
							title: t("StockQty"),
							textAlign: "left",
							width: 110,
							render: (record) => {
								const maxStock = Math.max(
									0,
									(record.sales_quantity || 0) - (record.damage_quantity || 0)
								);
								return (
									<NumberInput
										size="xs"
										value={record.stock_quantity}
										min={0}
										max={maxStock}
										clampBehavior="strict"
										step={1}
										hideControls
										onChange={(value) => handleStockQuantityChange(record.id, value)}
									/>
								);
							},
						},
						{
							accessor: "damage_quantity",
							title: t("DamageQty"),
							textAlign: "left",
							width: 110,
							render: (record) => {
								const maxDamage = Math.max(
									0,
									(record.sales_quantity || 0) - (record.stock_quantity || 0)
								);
								return (
									<NumberInput
										size="xs"
										value={record.damage_quantity}
										min={0}
										max={maxDamage}
										clampBehavior="strict"
										step={1}
										hideControls
										onChange={(value) => handleDamageQuantityChange(record.id, value)}
									/>
								);
							},
						},
						{
							accessor: "subTotal",
							title: t("SubTotal"),
							textAlign: "right",
							width: 110,
							render: (record) => {
								const subTotal =
									((record.stock_quantity || 0) + (record.damage_quantity || 0)) *
									(record.sales_price || 0);
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
					noRecordsText={t("NoItemsAdded")}
				/>
			</Box>
			<Box ml="xs" mt="xs" px="xs" py="4xs" bg="var(--theme-tertiary-color-2)" className="borderRadiusAll">
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
