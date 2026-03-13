import {Divider, Grid, Paper, ScrollArea, Text} from "@mantine/core";
import { IconCurrencyTaka, IconDiscount, IconReceipt } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";
import { formatCurrency } from "@utils/index";

const STAT_ITEMS = [
    { icon: IconCurrencyTaka, labelKey: "OpeningStock", valueKey: "OpeningStock", format: "currency", color: "blue" },
    { icon: IconCurrencyTaka, labelKey: "Receive", valueKey: "Receive", format: "currency", color: "green" },
    { icon: IconDiscount, labelKey: "TotalStock", valueKey: "TotalStock", format: "currency", color: "orange" },
    { icon: IconReceipt, labelKey: "TotalSales", valueKey: "TotalSales", format: "number", color: "grape" },
    { icon: IconReceipt, labelKey: "Discount", valueKey: "Discount", format: "number", color: "yellow" },
    { icon: IconReceipt, labelKey: "TotalSalesAfterDiscount", valueKey: "TotalSalesAfterDiscount", format: "number", color: "indigo" },
    { icon: IconReceipt, labelKey: "Return", valueKey: "Return", format: "number", color: "gray" },
    { icon: IconReceipt, labelKey: "Wastage", valueKey: "Wastage", format: "number", color: "teal" },
    { icon: IconReceipt, labelKey: "ClosingStock", valueKey: "ClosingStock", format: "number", color: "violet" },
    { icon: IconReceipt, labelKey: "TotalInvoices", valueKey: "totalInvoices", format: "number", color: "red" },
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
