import { ActionIcon, Box, Flex, NumberInput, Text, Button, Badge, Group, SimpleGrid } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { IconList, IconTrashX } from "@tabler/icons-react";
import tableCss from "@assets/css/Table.module.css";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";
import { useNavigate } from "react-router";
import { APP_NAVLINKS } from "@/routes/routes";
import { useTranslation } from "react-i18next";

function formatMoneyOrDash(value, currencySymbol, formatCurrency) {
	if (value === null || value === undefined || value === "") {
		return "—";
	}
	const numericValue = Number(value);
	if (!Number.isFinite(numericValue)) {
		return "—";
	}
	return `${currencySymbol} ${formatCurrency(numericValue)}`;
}

function computeDueAmount(sale) {
	const balance = sale.balance;
	if (balance !== null && balance !== undefined && String(balance).trim() !== "") {
		const numericBalance = Number(balance);
		if (Number.isFinite(numericBalance)) {
			return numericBalance;
		}
	}
	const total = Number(sale.total) || 0;
	const payment = Number(sale.payment) || 0;
	return total - payment;
}

function InlineLabelValue({ label, children }) {
	return (
		<Box style={{ minWidth: 0, width: "100%" }}>
			<Text size="xs" lineClamp={1}>
				<Text component="span" c="dimmed">
					{label}
					{": "}
				</Text>
				<Text component="span" fw={500}>
					{children}
				</Text>
			</Text>
		</Box>
	);
}

export default function ItemsTableSection({
	itemsProducts,
	itemsTotal,
	selectedSaleSummary,
	onItemUpdate,
	onRemoveItem,
}) {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const summaryBlockHeight = selectedSaleSummary ? 72 : 0;
	const tableHeight = mainAreaHeight - 206 - summaryBlockHeight;
	const { currencySymbol } = useConfigData();

	// =============== line amount from returned qty × unit price (2dp); qty fields drive this ===============
	const computeLineSubTotalFromQuantities = (stockQuantity, damageQuantity, salesPrice) => {
		const returnedQuantity =
			(Number(stockQuantity) || 0) + (Number(damageQuantity) || 0);
		const unitPrice = Number(salesPrice) || 0;
		const raw = Math.max(0, returnedQuantity * unitPrice);
		return Math.round(raw * 100) / 100;
	};

	const handleStockQuantityChange = (itemId, value) => {
		const stockQuantity = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const damageQuantity = currentItem?.damage_quantity || 0;
		const salesQuantity = currentItem?.sales_quantity || 0;

		// =============== clamp so stock + damage never exceeds sales quantity ===============
		const clampedStock = Math.min(stockQuantity, Math.max(0, salesQuantity - damageQuantity));
		const subTotal = computeLineSubTotalFromQuantities(
			clampedStock,
			damageQuantity,
			currentItem?.sales_price
		);
		onItemUpdate(itemId, { stock_quantity: clampedStock, sub_total: subTotal });
	};

	const handleDamageQuantityChange = (itemId, value) => {
		const damageQuantity = parseFloat(value) || 0;
		const currentItem = itemsProducts.find((item) => item.id === itemId);
		const stockQuantity = currentItem?.stock_quantity || 0;
		const salesQuantity = currentItem?.sales_quantity || 0;

		// =============== clamp so stock + damage never exceeds sales quantity ===============
		const clampedDamage = Math.min(damageQuantity, Math.max(0, salesQuantity - stockQuantity));
		const subTotal = computeLineSubTotalFromQuantities(
			stockQuantity,
			clampedDamage,
			currentItem?.sales_price
		);
		onItemUpdate(itemId, { damage_quantity: clampedDamage, sub_total: subTotal });
	};

	const handleLineSubTotalChange = (itemId, value) => {
		const numericValue = value === "" || value === undefined ? 0 : parseFloat(value);
		const safeValue = Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
		onItemUpdate(itemId, { sub_total: safeValue });
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
			{selectedSaleSummary ? (
				<Box
					mb="xs"
					ml="xs"
					p="xs"
					bg="var(--mantine-color-gray-0)"
					className="borderRadiusAll"
					bd="1px solid #dee2e6"
				>
					<SimpleGrid cols={5} spacing="6px" verticalSpacing="4px">
						<InlineLabelValue label={t("Created")}>{selectedSaleSummary.created ?? "—"}</InlineLabelValue>
						<InlineLabelValue label={t("Invoice")}>{selectedSaleSummary.invoice ?? "—"}</InlineLabelValue>
						<InlineLabelValue label={t("Name")}>
							{selectedSaleSummary.customerName ?? "—"}
						</InlineLabelValue>
						<InlineLabelValue label={t("Mobile")}>{selectedSaleSummary.customerMobile ?? "—"}</InlineLabelValue>
						<InlineLabelValue label={t("SubTotal")}>
							{formatMoneyOrDash(selectedSaleSummary.sub_total, currencySymbol, formatCurrency)}
						</InlineLabelValue>
						<InlineLabelValue label={t("Balance")}>
							{formatMoneyOrDash(selectedSaleSummary.balance, currencySymbol, formatCurrency)}
						</InlineLabelValue>
						<InlineLabelValue label={t("Total")}>
							{formatMoneyOrDash(selectedSaleSummary.total, currencySymbol, formatCurrency)}
						</InlineLabelValue>
						<InlineLabelValue label={t("Discount")}>
							{formatMoneyOrDash(selectedSaleSummary.discount, currencySymbol, formatCurrency)}
						</InlineLabelValue>
						<InlineLabelValue label={t("Receive")}>
							{formatMoneyOrDash(selectedSaleSummary.payment, currencySymbol, formatCurrency)}
						</InlineLabelValue>
						<InlineLabelValue label={t("Due")}>
							{formatMoneyOrDash(computeDueAmount(selectedSaleSummary), currencySymbol, formatCurrency)}
						</InlineLabelValue>
					</SimpleGrid>
				</Box>
			) : null}
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
							render: (record) => (
								<Text size="sm">{record.display_name || "—"}</Text>
							),
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
							width: 120,
							render: (record) => (
								<NumberInput
									size="xs"
									value={record.sub_total ?? 0}
									min={0}
									decimalScale={2}
									fixedDecimalScale
									hideControls
									styles={{ input: { textAlign: "right", fontWeight: 600 } }}
									leftSection={currencySymbol}
									leftSectionWidth={28}
									onChange={(value) => handleLineSubTotalChange(record.id, value)}
								/>
							),
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
