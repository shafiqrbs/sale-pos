import { Box } from "@mantine/core";
import Table from "./Table";
import CoreHeaderNavbar from "@components/core/CoreHeaderNavbar";
import { useTranslation } from "react-i18next";

export default function Index() {
	const { t } = useTranslation();

	return (
		<Box p="xs" bg="var(--mantine-color-gray-2)">
			{/*<CoreHeaderNavbar pageTitle={t("ManageCustomer")} />*/}
			<Box className=" border-top-none">
				<Table />
			</Box>
		</Box>
	);
}
