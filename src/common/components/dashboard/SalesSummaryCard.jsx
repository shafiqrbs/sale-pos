import { Grid, Paper, Text } from "@mantine/core";
import { IconCurrencyTaka, IconDiscount, IconReceipt } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";

export default function SalesSummaryCard({ dailyData }) {
    const { t } = useTranslation();

    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
            <Text size="lg" fw={700} mb="md">{t("TodaysSalesSummary")}</Text>

            <Grid gutter="md">
                <Grid.Col span={6}>
                    <StatCard
                        icon={<IconCurrencyTaka size={24} />}
                        label={t("TotalSales")}
                        value={`৳ ${dailyData.totalSales.toFixed(2)}`}
                        color="blue"
                    />
                </Grid.Col>
                <Grid.Col span={6}>
                    <StatCard
                        icon={<IconDiscount size={24} />}
                        label={t("Discount")}
                        value={`৳ ${dailyData.totalDiscount.toFixed(2)}`}
                        color="orange"
                    />
                </Grid.Col>
                <Grid.Col span={6}>
                    <StatCard
                        icon={<IconCurrencyTaka size={24} />}
                        label={t("Receive")}
                        value={`৳ ${dailyData.totalPayment.toFixed(2)}`}
                        color="green"
                    />
                </Grid.Col>
                <Grid.Col span={6}>
                    <StatCard
                        icon={<IconReceipt size={24} />}
                        label={t("TotalInvoices")}
                        value={dailyData.totalInvoices}
                        color="grape"
                    />
                </Grid.Col>
            </Grid>
        </Paper>
    );
}
