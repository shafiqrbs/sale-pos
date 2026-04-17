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
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";

export default function InvoiceForm({
	vendorOptions,
	selectedReturnMode,
	selectedVendorId,
	filteredPurchases,
	selectedPurchaseId,
	onReturnTypeChange,
	onVendorChange,
	onPurchaseCardClick,
}) {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const { currencySymbol } = useConfigData();
	const purchaseListScrollHeight = mainAreaHeight - 200;

	const isSelectionReady = Boolean(selectedReturnMode && selectedVendorId);
	const emptyMessage = !isSelectionReady
		? t("SelectReturnTypeAndVendorFirst")
		: t("NoPurchasesFound");

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
						placeholder={t("ChooseReturnType")}
						data={[ "General", "Requisition" ]}
						value={selectedReturnMode}
						onChange={onReturnTypeChange}
						clearable
						searchable
					/>
				</Box>
				<Box mt="xs">
					<Select
						placeholder={t("Vendor")}
						data={vendorOptions}
						value={selectedVendorId}
						onChange={onVendorChange}
						clearable
						searchable
						disabled={!selectedReturnMode}
					/>
				</Box>
			</Box>
			<Divider />
			<Box px="sm" py="sm">
				<ScrollArea h={purchaseListScrollHeight} type="never">
					{filteredPurchases.length === 0 ? (
						<Center py="xl">
							<Text fz="sm" c="dimmed">
								{emptyMessage}
							</Text>
						</Center>
					) : (
						<Stack gap="xs">
							{filteredPurchases.map((purchase) => {
								const isSelected = selectedPurchaseId === String(purchase.id);
								return (
									<Card
										key={purchase.id}
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
										onClick={() => onPurchaseCardClick(purchase)}
									>
										<Text
											fz="sm"
											fw={600}
											c={isSelected ? "var(--theme-primary-color-6)" : undefined}
										>
											{purchase.invoice}
										</Text>
										<Group justify="space-between" mt={4}>
											<Text fz="xs" c="dimmed">
												{purchase.created}
											</Text>
											<Badge size="sm" color="teal">
												{currencySymbol} {formatCurrency(purchase.total)}
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
