import { Badge, Box, Card, Center, Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { formatCurrency } from "@utils/index";

export default function PurchaseCardsPanel({
	filteredPurchases,
	selectedPurchaseId,
	selectedReturnMode,
	selectedVendorId,
	onPurchaseCardClick,
}) {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const { currencySymbol } = useConfigData();
	const scrollAreaHeight = mainAreaHeight - 68;

	const isSelectionReady = Boolean(selectedReturnMode && selectedVendorId);

	const emptyMessage = !isSelectionReady
		? t("SelectReturnTypeAndVendorFirst")
		: t("NoPurchasesFound");

	return (
		<Box bd="1px solid #dee2e6" pb="sm" bg="white" className="borderRadiusAll">
			<Box
				p="sm"
				fz="sm"
				fw={600}
				bg="var(--theme-primary-color-8)"
				c="white"
				className="boxBackground textColor borderRadiusAll"
			>
				{t("SalesList")}
			</Box>
			<Divider />
			<ScrollArea h={scrollAreaHeight} type="never">
				<Box p="sm">
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
				</Box>
			</ScrollArea>
		</Box>
	);
}
