import { Box, Grid } from "@mantine/core";
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
	const { dailyData, isLoading, refetch } = useDailyMatrixData({ offlineFetch: !isOnline || !isOnlinePermissionIncludes });

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
		</Box>
	);
}
