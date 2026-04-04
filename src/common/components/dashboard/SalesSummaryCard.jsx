import { Divider, Grid, Paper, ScrollArea, Text } from "@mantine/core";
import { IconCurrencyTaka, IconDiscount, IconReceipt } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";
import { formatCurrency } from "@utils/index";

const STAT_ITEMS = [
    { icon: IconCurrencyTaka, labelKey: "OpeningBalance", valueKey: "totalOpeningBalance", format: "currency", color: "blue" },
    { icon: IconCurrencyTaka, labelKey: "PurchaseReceive", valueKey: "receive", format: "currency", color: "green" },
    { icon: IconDiscount, labelKey: "TotalStock", valueKey: "totalStock", format: "currency", color: "orange" },
    { icon: IconReceipt, labelKey: "TotalSales", valueKey: "totalSales", format: "currency", color: "grape" },
    { icon: IconReceipt, labelKey: "Discount", valueKey: "totalDiscount", format: "currency", color: "yellow" },
    { icon: IconReceipt, labelKey: "TotalSalesAfterDiscount", valueKey: "total", format: "currency", color: "indigo" },
    { icon: IconReceipt, labelKey: "Return", valueKey: "return", format: "currency", color: "gray" },
    { icon: IconReceipt, labelKey: "Wastage/Leftover", valueKey: "wastage", format: "currency", color: "teal" },
    { icon: IconReceipt, labelKey: "ClosingBalance", valueKey: "totalClosingBalance", format: "currency", color: "violet" },
    { icon: IconReceipt, labelKey: "TotalInvoices", valueKey: "totalInvoices", format: "currency", color: "red" },
];


export default function SalesSummaryCard({ dailyData, cardHeight }) {
    const { t } = useTranslation();

    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
            <Text size="lg" fw={700} mb="md">{t("Today's Stock & Sales Summary")}</Text>
            <Divider />
            <ScrollArea scrollbarSize={4} scrollbars="y" type="hover" h={cardHeight}>
                <Grid gutter="md" mt={'md'}>
                    {STAT_ITEMS.map((item) => {
                        const value = item.format === "currency" ? `৳ ${formatCurrency(dailyData[ item.valueKey ])}` : dailyData[ item.valueKey ];
                        const IconComponent = item.icon;
                        return (
                            <Grid.Col key={item.labelKey} span={6}>
                                <StatCard
                                    icon={<IconComponent size={32} />}
                                    label={t(item.labelKey)}
                                    value={value}
                                    color={item.color}
                                />
                            </Grid.Col>
                        );
                    })}
                </Grid>
            </ScrollArea>
        </Paper>
    );
}
