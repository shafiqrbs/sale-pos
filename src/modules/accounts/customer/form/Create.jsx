import { useTranslation } from "react-i18next";
import GlobalModal from "@components/modals/GlobalModal";
import Form from "./Form";

function ReceiveCreateModal({
								opened,
								onClose
							}) {
	const { t } = useTranslation();

	const handleSuccess = () => {
		onClose();
	};

	return (
		<GlobalModal
			opened={opened}
			onClose={onClose}
			title={t("CustomerPaymentReceive")}
			size="lg"
		>
			<Form mode="create" onSuccess={handleSuccess} />
		</GlobalModal>
	);
}

export default ReceiveCreateModal;
