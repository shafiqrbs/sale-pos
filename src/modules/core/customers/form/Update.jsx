import { useTranslation } from 'react-i18next';
import GlobalModal from "@components/modals/GlobalModal";
import Form from "./Form";

export default function CustomerUpdateModal({
	opened,
	onClose,
	entityEditData
}) {
	const { t } = useTranslation();

	const handleSuccess = () => {
		onClose();
	};

	return (
		<GlobalModal
			opened={opened}
			onClose={onClose}
			title={t("UpdateCustomer")}
			size="lg"
		>
			<Form mode="update" entityEditData={entityEditData} onSuccess={handleSuccess} />
		</GlobalModal>
	);
}