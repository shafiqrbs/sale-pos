import { Box } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { useApprovePurchaseMutation, useCopyPurchaseMutation } from "@services/purchase";
import PurchaseTable from "../common/PurchaseTable";

export default function PurchaseIndex() {
	const { t } = useTranslation();
	const [approvePurchase] = useApprovePurchaseMutation();
	const [copyPurchase] = useCopyPurchaseMutation();

	return (
		<Box p="xs" bg="var(--mantine-color-gray-1)">
			<PurchaseTable
				approveMutation={approvePurchase}
				copyMutation={copyPurchase}
				modalTitlePrefix={t("Purchase")}
			/>
		</Box>
	);
}
