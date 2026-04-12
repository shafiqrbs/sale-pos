import { useTranslation } from "react-i18next";
import { Text } from "@mantine/core";
import GlobalDrawer from "@components/drawers/GlobalDrawer";
import Form from "./Form";

export default function ParticularUpdateDrawer({ isLoading, opened, onClose, entityEditData }) {
	const { t } = useTranslation();

	return (
		<GlobalDrawer
			loading={isLoading}
			opened={opened}
			onClose={onClose}
			title={
				<Text fw="600" fz="16">
					{t("UpdateSetting")}
				</Text>
			}
			size="32%"
		>
			<Form mode="update" entityEditData={entityEditData} onSuccess={onClose} />
		</GlobalDrawer>
	);
}
