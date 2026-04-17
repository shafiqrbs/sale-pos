import { Box, Divider, Select } from "@mantine/core";
import { useTranslation } from "react-i18next";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

export default function InvoiceForm({
	vendorOptions,
	selectedReturnMode,
	selectedVendorId,
	onReturnTypeChange,
	onVendorChange,
}) {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();

	return (
		<Box h={mainAreaHeight - 6} bd="1px solid #dee2e6" bg="white" className="borderRadiusAll">
			<Box
				p="sm"
				fz="sm"
				fw={600}
				bg="var(--theme-primary-color-8)"
				c="white"
				className="boxBackground textColor borderRadiusAll"
			>
				{t("PurchaseReturn")}
			</Box>
			<Divider />
			<Box p="sm">
				<Box mt="xs">
					<Select
						placeholder={t("ChooseReturnType")}
						data={["General", "Requisition"]}
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
		</Box>
	);
}
