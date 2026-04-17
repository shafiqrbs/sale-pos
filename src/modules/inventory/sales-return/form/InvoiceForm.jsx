import { useState } from "react";
import {
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

export default function InvoiceForm({
	customerOptions,
	selectedCustomerId,
	filteredSales,
	selectedSaleId,
	onCustomerChange,
	onDateChange,
	onInvoiceSearchChange,
	onSaleCardClick,
}) {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const { currencySymbol } = useConfigData();
	const purchaseListScrollHeight = Math.max(mainAreaHeight - 6 - 280, 120);

	const [ invoiceInputValue, setInvoiceInputValue ] = useState("");
	const [ selectedDate, setSelectedDate ] = useState(null);

	const debouncedInvoiceSearch = useDebouncedCallback((value) => {
		onInvoiceSearchChange(value);
	}, 400);

	const handleInvoiceInputChange = (event) => {
		const value = event.currentTarget.value;
		setInvoiceInputValue(value);
		debouncedInvoiceSearch(value);
	};

	const handleDateChange = (dateValue) => {
		setSelectedDate(dateValue);
		onDateChange(dateValue);
	};

	const emptyMessage = !selectedCustomerId
		? t("SelectCustomerFirst")
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
