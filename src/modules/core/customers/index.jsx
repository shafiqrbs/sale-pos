import { Box } from "@mantine/core";
import Table from "./Table";
import CoreHeaderNavbar from "@components/core/CoreHeaderNavbar";
import { useTranslation } from "react-i18next";

export default function Index() {
	const { t } = useTranslation();

	return (
		<Box p="xs" bg="var(--theme-grey-color-0)">
			<CoreHeaderNavbar pageTitle={t("ManageCustomer")} />
			<Box className="borderRadiusAll border-top-none">
				<Table />
			</Box>
		</Box>
	);
}
