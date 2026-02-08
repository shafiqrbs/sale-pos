import { Box, Grid, Loader, Center } from "@mantine/core";
import useDailyMatrixData from "@hooks/useDailyMatrixData";
import SalesSummaryCard from "@components/dashboard/SalesSummaryCard";
import TransactionModesCard from "@components/dashboard/TransactionModesCard";
import TopSellingProductsCard from "@components/dashboard/TopSellingProductsCard";
import TodaysOverviewCard from "@components/dashboard/TodaysOverviewCard";
import { useOutletContext } from "react-router";

export default function DashboardIndex() {
    const { dailyData, isLoading } = useDailyMatrixData();
    const { mainAreaHeight } = useOutletContext();

    const height = mainAreaHeight - 40;
    const cardHeight = (height - 166) / 2;

    if (isLoading) {
        return (
            <Center h={height}>
                <Loader size="lg" />
            </Center>
        );
    }

    console.log(dailyData)

    return (
        <Box p="md">
            <Grid gutter="md" mb="md">
                {/* =============== sales summary ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <SalesSummaryCard dailyData={dailyData} cardHeight={cardHeight} />
                </Grid.Col>

                {/* =============== transaction modes ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TransactionModesCard dailyData={dailyData} cardHeight={cardHeight} />
                </Grid.Col>

                {/* =============== top selling products ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TopSellingProductsCard dailyData={dailyData} cardHeight={cardHeight} />
                </Grid.Col>

                {/* =============== today's overview ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TodaysOverviewCard dailyData={dailyData} cardHeight={cardHeight} />
                </Grid.Col>
            </Grid>
        </Box>
    );
}

