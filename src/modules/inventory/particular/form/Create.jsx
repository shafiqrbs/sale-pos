import { useTranslation } from "react-i18next";
import { Text } from "@mantine/core";
import GlobalDrawer from "@components/drawers/GlobalDrawer";
import Form from "./Form";

export default function ParticularCreateDrawer({ opened, onClose }) {
	const { t } = useTranslation();

	return (
		<GlobalDrawer
			opened={opened}
			onClose={onClose}
			title={
				<Text fw="600" fz="16">
					{t("CreateSetting")}
				</Text>
			}
			size="32%"
		>
			<Form mode="create" onSuccess={onClose} />
		</GlobalDrawer>
	);
}
