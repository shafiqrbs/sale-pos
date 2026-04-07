import { Box } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { APP_NAVLINKS } from "@/routes/routes";
import { useApproveInvoicePurchaseMutation, useCopyInvoicePurchaseMutation } from "@services/invoice-purchase";
import PurchaseTable from "../common/PurchaseTable";

export default function InvoicePurchaseIndex() {
	const { t } = useTranslation();
	const [approveInvoicePurchase] = useApproveInvoicePurchaseMutation();
	const [copyInvoicePurchase] = useCopyInvoicePurchaseMutation();

	return (
		<Box p="xs" bg="var(--mantine-color-gray-1)">
			<PurchaseTable
				approveMutation={approveInvoicePurchase}
				copyMutation={copyInvoicePurchase}
				editLink={APP_NAVLINKS.INVOICE_PURCHASE_EDIT}
				modalTitlePrefix={t("InvoicePurchase")}
			/>
		</Box>
	);
}
