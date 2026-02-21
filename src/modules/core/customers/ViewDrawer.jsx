import { Grid, Box, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import GlobalDrawer from "@components/drawers/GlobalDrawer";

export default function ViewDrawer({ isLoading, opened, onClose, data }) {
	const { t } = useTranslation();

	return (
		<GlobalDrawer
			loading={isLoading}
			opened={opened}
			onClose={onClose}
			position="right"
			size="400px"
			title={
				<Text fw="600" fz="16">
					{t("CustomerDetailsData")}
				</Text>
			}
		>
			<Box bg="white">
				<Box p="md" className="border-all-radius box-bg">
					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("CustomerId")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.id}</Grid.Col>
					</Grid>
					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("Name")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.name}</Grid.Col>
					</Grid>
					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("Mobile")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.mobile}</Grid.Col>
					</Grid>

					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("AlternativeMobile")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.alternative_mobile}</Grid.Col>
					</Grid>

					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("Email")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.email}</Grid.Col>
					</Grid>

					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("ReferenceId")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.reference_id}</Grid.Col>
					</Grid>

					<Grid columns={24}>
						<Grid.Col span="8" align="left" fw="600" fz="14">
							{t("Created")}
						</Grid.Col>
						<Grid.Col span="1">:</Grid.Col>
						<Grid.Col span="auto">{data?.created_date}</Grid.Col>
					</Grid>
				</Box>
			</Box>
		</GlobalDrawer>
	);
}
