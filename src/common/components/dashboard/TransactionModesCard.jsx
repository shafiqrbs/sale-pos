import { Box, Paper, Text, Stack, Group, Badge, Center } from "@mantine/core";
import { PieChart } from "@mantine/charts";
import { useTranslation } from "react-i18next";
import { getRandomColor } from "@utils/index";

export default function TransactionModesCard({ dailyData }) {
    const { t } = useTranslation();

    // =============== prepare data for transaction modes chart ================
    const transactionModesChartData = dailyData.transactionModes.map(mode => ({
        name: mode.name,
        value: Number(mode.amount.toFixed(2)),
        color: getRandomColor()
    }));

    return (
        <Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
            <Text size="lg" fw={700} mb="md">{t("TransactionModes")}</Text>

            {transactionModesChartData.length > 0 ? (
                <Box>
                    <PieChart
                        data={transactionModesChartData}
                        h={250}
                        withLabelsLine
                        labelsPosition="outside"
                        labelsType="value"
                        withTooltip
                    />

                    <Stack gap="xs" mt="md">
                        {dailyData.transactionModes.map((mode, index) => (
                            <Group key={index} justify="space-between">
                                <Group gap="xs">
                                    <Box
                                        w={12}
                                        h={12}
                                        style={{
                                            borderRadius: '50%',
                                            backgroundColor: transactionModesChartData[ index ]?.color
                                        }}
                                    />
                                    <Text size="sm">{mode.name}</Text>
                                    <Badge size="sm" variant="light">{mode.count}</Badge>
                                </Group>
                                <Text size="sm" fw={600}>৳ {mode.amount.toFixed(2)}</Text>
                            </Group>
                        ))}
                    </Stack>
                </Box>
            ) : (
                <Center h={250}>
                    <Text c="dimmed">{t("NoTransactionDataAvailable")}</Text>
                </Center>
            )}
        </Paper>
    );
}
