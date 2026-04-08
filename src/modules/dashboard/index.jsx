import { useState } from "react";
import { Box, Grid, Loader, Center, ActionIcon, Tooltip, Transition } from "@mantine/core";
import { IconCloud, IconCloudOff } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import useDailyMatrixData from "@hooks/useDailyMatrixData";
import SalesSummaryCard from "@components/dashboard/SalesSummaryCard";
import TransactionModesCard from "@components/dashboard/TransactionModesCard";
import TopSellingProductsCard from "@components/dashboard/TopSellingProductsCard";
import TodaysOverviewCard from "@components/dashboard/TodaysOverviewCard";
import { useOutletContext } from "react-router";
import useLoggedInUser from "@hooks/useLoggedInUser";
import DashboardSkeleton from "@components/skeletons/DashboardSkeleton";

export default function DashboardIndex() {
	const { isOnline, mainAreaHeight } = useOutletContext();
	const { isOnlinePermissionIncludes } = useLoggedInUser();
	const { dailyData, isLoading, refetch } = useDailyMatrixData({ offlineFetch: !isOnline });

	// const toggleDashboardMode = () => {
	// 	if (!dashboardOnline && !isOnline) {
	// 		notifications.show({
	// 			title: "Dashboard Mode",
	// 			message: "App must be online to switch to online mode",
	// 			color: "red",
	// 			autoClose: 3000,
	// 		});
	// 		return;
	// 	}

	// 	const nextMode = !dashboardOnline;
	// 	setDashboardOnline(nextMode);
	// 	notifications.show({
	// 		title: "Dashboard Mode",
	// 		message: nextMode ? "Showing online data" : "Showing offline data",
	// 		color: nextMode ? "teal" : "orange",
	// 		autoClose: 2000,
	// 	});
	// };

	const height = mainAreaHeight - 40;
	const cardHeight = (height - 166) / 2;

	if (isLoading) {
		return <DashboardSkeleton height={height} cardHeight={cardHeight} />;
	}

	return (
		<Box p="md">
			<Grid gutter="md" mb="md">
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Grid gutter="md" mb="md">
						<Grid.Col span={{ base: 12 }}>
							<SalesSummaryCard dailyData={dailyData} refetch={refetch} cardHeight={height - 64} />
						</Grid.Col>
					</Grid>
				</Grid.Col>
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Grid gutter="md" mb="md">
						{/* =============== transaction modes ================ */}
						<Grid.Col span={{ base: 12 }}>
							<TransactionModesCard dailyData={dailyData} cardHeight={cardHeight} />
						</Grid.Col>
						{/* =============== top selling products ================ */}
						<Grid.Col span={{ base: 12 }}>
							<TopSellingProductsCard dailyData={dailyData} cardHeight={cardHeight} />
						</Grid.Col>
						{/* =============== today's overview ================ */}
						<Grid.Col span={{ base: 12 }}>
							<TodaysOverviewCard dailyData={dailyData} cardHeight={cardHeight} />
						</Grid.Col>
					</Grid>
				</Grid.Col>
			</Grid>
			<Grid gutter="md" mb="md">
				{/* =============== sales summary ================ */}
			</Grid>

			{/* =============== floating online/offline toggle ================ */}
			{/* {isOnlinePermissionIncludes ? (
				<Transition mounted={true} transition="slide-up" duration={300}>
					{(styles) => (
						<Tooltip
							label={dashboardOnline ? "Switch to Offline" : "Switch to Online"}
							position="left"
							withArrow
						>
							<ActionIcon
								style={{
									...styles,
									position: "fixed",
									bottom: 60,
									right: 24,
									zIndex: 1000,
									boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
								}}
								variant="filled"
								size={48}
								radius="xl"
								color={dashboardOnline ? "teal" : "gray"}
								onClick={toggleDashboardMode}
								aria-label={dashboardOnline ? "Switch to offline mode" : "Switch to online mode"}
							>
								{dashboardOnline ? <IconCloud size={22} /> : <IconCloudOff size={22} />}
							</ActionIcon>
						</Tooltip>
					)}
				</Transition>
			) : null} */}
		</Box>
	);
}
