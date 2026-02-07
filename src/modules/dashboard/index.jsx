import { Box, Grid, Loader, Center } from "@mantine/core";
import useDailyMatrixData from "@hooks/useDailyMatrixData";
import SalesSummaryCard from "@components/dashboard/SalesSummaryCard";
import TransactionModesCard from "@components/dashboard/TransactionModesCard";
import TopSellingProductsCard from "@components/dashboard/TopSellingProductsCard";
import TodaysOverviewCard from "@components/dashboard/TodaysOverviewCard";

export default function DashboardIndex() {
    const { dailyData, isLoading } = useDailyMatrixData();

    if (isLoading) {
        return (
            <Center h={400}>
                <Loader size="lg" />
            </Center>
        );
    }

    return (
        <Box p="md">
            <Grid gutter="md" mb="md">
                {/* =============== sales summary ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <SalesSummaryCard dailyData={dailyData} />
                </Grid.Col>

                {/* =============== transaction modes ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TransactionModesCard dailyData={dailyData} />
                </Grid.Col>
            </Grid>

            <Grid gutter="md">
                {/* =============== top selling products ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TopSellingProductsCard dailyData={dailyData} />
                </Grid.Col>

                {/* =============== today's overview ================ */}
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TodaysOverviewCard dailyData={dailyData} />
                </Grid.Col>
            </Grid>
        </Box>
    );
}

