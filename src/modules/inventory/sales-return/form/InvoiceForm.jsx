import { useState, useRef } from "react";
import {
	ActionIcon,
	Badge,
	Box,
	Card,
	Center,
	Divider,
	Group,
	ScrollArea,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useDebouncedCallback } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";
import { IconX } from "@tabler/icons-react";

const SEARCH_DEBOUNCE_MS = 400;

export default function InvoiceForm({
	customerOptions,
	selectedCustomerId,
	filteredSales,
	selectedSaleId,
	onCustomerChange,
	onDateChange,
	onBarcodeChange,
	onInvoiceSearchChange,
	onSaleCardClick,
	salesSearchActive,
}) {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const { currencySymbol } = useConfigData();
	const purchaseListScrollHeight = Math.max(mainAreaHeight - 6 - 320, 120);

	const [barcodeInputValue, setBarcodeInputValue] = useState("");
	const [invoiceInputValue, setInvoiceInputValue] = useState("");
	const [selectedDate, setSelectedDate] = useState(null);

	// =============== refs track latest input so debounced callbacks ignore stale fires after clear or fast edits ===============
	const barcodeInputRef = useRef("");
	const invoiceInputRef = useRef("");

	const debouncedBarcodeChange = useDebouncedCallback((value) => {
		if (barcodeInputRef.current !== value) return;
		onBarcodeChange(value);
	}, SEARCH_DEBOUNCE_MS);

	const debouncedInvoiceSearch = useDebouncedCallback((value) => {
		if (invoiceInputRef.current !== value) return;
		onInvoiceSearchChange(value);
	}, SEARCH_DEBOUNCE_MS);

	const handleBarcodeInputChange = (event) => {
		const value = event.currentTarget.value;
		setBarcodeInputValue(value);
		barcodeInputRef.current = value;
		if (value === "") {
			onBarcodeChange("");
			return;
		}
		debouncedBarcodeChange(value);
	};

	const handleInvoiceInputChange = (event) => {
		const value = event.currentTarget.value;
		setInvoiceInputValue(value);
		invoiceInputRef.current = value;
		if (value === "") {
			onInvoiceSearchChange("");
			return;
		}
		debouncedInvoiceSearch(value);
	};

	const clearBarcode = () => {
		setBarcodeInputValue("");
		barcodeInputRef.current = "";
		onBarcodeChange("");
	};

	const handleDateChange = (dateValue) => {
		setSelectedDate(dateValue);
		onDateChange(dateValue);
	};

	const emptyMessage = !salesSearchActive
		? t("ApplyAtLeastOneSalesFilter")
		: t("NoSalesFound");

	return (
		<Box
			h={mainAreaHeight - 6}
			bd="1px solid #dee2e6"
			bg="white"
			className="borderRadiusAll"
		>
			<Box
				p="sm"
				fz="sm"
				fw={600}
				bg="var(--theme-primary-color-8)"
				c="white"
				className="boxBackground textColor borderRadiusAll"
			>
				{t("SalesReturn")}
			</Box>
			<Divider />
			<Box p="sm">
				<TextInput
					rightSection={
						barcodeInputValue ? (
							<ActionIcon variant="subtle" onClick={clearBarcode}>
								<IconX size={16} color="red" />
							</ActionIcon>
						) : null
					}
					placeholder={t("Barcode")}
					value={barcodeInputValue}
					onChange={handleBarcodeInputChange}
				/>
				<Box mt="xs">
					<Select
						placeholder={t("Customer")}
						data={customerOptions}
						value={selectedCustomerId}
						onChange={onCustomerChange}
						clearable
						searchable
					/>
				</Box>
				<Box mt="xs">
					<DateInput
						placeholder="DD-MM-YYYY"
						valueFormat="DD-MM-YYYY"
						value={selectedDate}
						onChange={handleDateChange}
						clearable
					/>
				</Box>
				<Box mt="xs">
					<TextInput
						placeholder={t("SearchByInvoice")}
						value={invoiceInputValue}
						onChange={handleInvoiceInputChange}
					/>
				</Box>
			</Box>
			<Divider />
			<Box px="sm" py="sm">
				<ScrollArea h={purchaseListScrollHeight} type="never">
					{filteredSales.length === 0 ? (
						<Center py="xl">
							<Text fz="sm" c="dimmed">
								{emptyMessage}
							</Text>
						</Center>
					) : (
						<Stack gap="xs">
							{filteredSales.map((sale) => {
								const isSelected = selectedSaleId === String(sale.id);
								return (
									<Card
										key={sale.id}
										withBorder
										radius="sm"
										p="sm"
										className="cursor-pointer"
										style={{
											borderColor: isSelected
												? "var(--theme-primary-color-6)"
												: "#dee2e6",
											backgroundColor: isSelected
												? "var(--mantine-color-blue-0)"
												: "white",
											transition: "background-color 0.15s ease, border-color 0.15s ease",
										}}
										onClick={() => onSaleCardClick(sale)}
									>
										<Text
											fz="sm"
											fw={600}
											c={isSelected ? "var(--theme-primary-color-6)" : undefined}
										>
											{sale.invoice}
										</Text>
										<Group justify="space-between" mt={4}>
											<Text fz="xs" c="dimmed">
												{sale.created}
											</Text>
											<Badge size="sm" color="teal">
												{currencySymbol} {formatCurrency(sale.total)}
											</Badge>
										</Group>
									</Card>
								);
							})}
						</Stack>
					)}
				</ScrollArea>
			</Box>
		</Box>
	);
}
