import useConfigData from '@hooks/useConfigData';
import { ActionIcon, Grid, Box, Flex, Group, Image, Stack, Text, Tooltip } from '@mantine/core'
import { Carousel } from '@mantine/carousel';
import { IconScissors } from '@tabler/icons-react';
import { calculateVATAmount } from '@utils/index';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import useCartOperation from '@hooks/useCartOperation';
import SplitPaymentsDrawer from '@components/modals/SplitPaymentsDrawer';

export default function TransactionInformation({ form, transactionModeData }) {
    const { invoiceData, getCartTotal } = useCartOperation();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const { t } = useTranslation();
    const totalAmount = Math.round(getCartTotal()) - (form.values.discount ?? 0);
    const dueAmount = Math.abs(totalAmount - (form.values.receive_amount ?? 0));
    const returnOrDueText = form.values.receive_amount > totalAmount ? "Return" : "Due";

    const splitPaymentDrawerOpened = form.values.split_payment_drawer_opened ?? false
    const splitPayments = form.values.split_payments ?? []
    const isThisTableSplitPaymentActive = splitPayments.length > 0

    // ========= wreckages start =============
    const discountType = "Flat";
    // ========= wreckages stop =============

    // =============== handle opening split payment drawer ================
    const handleOpenSplitPaymentDrawer = () => {
        form.setFieldValue("split_payment_drawer_opened", true)
    }

    // =============== handle clearing split payments ================
    const clearTableSplitPayment = () => {
        form.setFieldValue("split_payments", [])
        form.setFieldValue("multi_transaction", 0);

        const cashMethod = transactionModeData.find(method => method.slug === "cash");
        form.setFieldValue("transaction_mode_id", cashMethod?.id);
        form.setFieldValue("transaction_mode_name", cashMethod?.name);
    }

    // =============== handle save split payments ================
    const handleSaveSplitPayments = (payments) => {
        // =============== calculate total amount from split payments ================
        const totalSplitAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

        // =============== update form values ================
        form.setFieldValue("split_payments", payments)
        form.setFieldValue("multi_transaction", 1)
        form.setFieldValue("receive_amount", totalSplitAmount)

        form.setFieldValue("transaction_mode_id", null)
        form.setFieldValue("transaction_mode_name", null)
    }

    const handleTransactionModel = (id, name) => {
        if (isThisTableSplitPaymentActive) {
            return;
        }

        form.setFieldValue("transaction_mode_id", id);
        form.setFieldValue("transaction_mode_name", name);
    };

    return (
        <>
            <Grid
                columns={13}
                gutter={4}
                justify="center"
                align="center"
                pb={4}
                bg="gray.1"
            >
                <Grid.Col span={7} px={4}>
                    <Grid bg="gray.1" px={4}>
                        <Grid.Col span={6}>
                            <Stack gap={0}>
                                <Group justify="space-between" gap={0}>
                                    <Text fz={"sm"} fw={500} c={"black"}>
                                        {t("DIS.")}
                                    </Text>
                                    <Text fz={"sm"} fw={800} c={"black"}>
                                        {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol} {invoiceData?.discount || 0}
                                    </Text>
                                </Group>
                                <Group justify="space-between">
                                    <Text fz={"sm"} fw={500} c={"black"}>
                                        {t("Type")}
                                    </Text>
                                    <Text fz={"sm"} fw={800} c={"black"}>
                                        {discountType === "Flat" ? t("Flat") : t("Percent")}
                                    </Text>
                                </Group>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Group justify="space-between">
                                <Text fz={"sm"} fw={500} c={"black"}>
                                    {t("VAT")} {configData?.inventory_config?.config_vat?.vat_percent}%
                                </Text>
                                <Text fz="sm" fw={800} c="black">
                                    {calculateVATAmount(
                                        10,
                                        configData?.inventory_config?.config_vat
                                    )}
                                </Text>
                            </Group>
                            <Group justify="space-between">
                                <Text fz={"sm"} fw={500} c={"black"}>
                                    {t("SD")}
                                </Text>
                                <Text fz={"sm"} fw={800} c={"black"}>
                                    {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol} 0
                                </Text>
                            </Group>
                        </Grid.Col>
                    </Grid>
                </Grid.Col>
                <Grid.Col span={3}>
                    <Stack
                        gap={0}
                        align="center"
                        justify="center"
                        bg="gray.8"
                        py={4}
                        bdrs={4}
                    >
                        <Text fw={800} c="white" size="lg">
                            {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol}{" "}
                            {totalAmount?.toFixed(2)}
                        </Text>
                        <Text fw={500} c="white" size="md">
                            {t("Total")}
                        </Text>
                    </Stack>
                </Grid.Col>
                <Grid.Col span={3}>
                    <Stack
                        gap={0}
                        align="center"
                        justify="center"
                        bg="red"
                        py={4}
                        bdrs={4}
                    >
                        <Text fw={800} c="white" size="lg">
                            {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol}{" "}
                            {(dueAmount)?.toFixed(2)}
                        </Text>
                        <Text fw={500} c="white" size="md">
                            {returnOrDueText}
                        </Text>
                    </Stack>
                </Grid.Col>
            </Grid>
            <Grid
                columns={24}
                gutter={2}
                align="center"
                justify="center"
                mb={4}
                bdrs={4}
            >
                <Grid.Col span={21}>
                    <Box mr={4}>
                        <Tooltip
                            label={t("TransactionMode")}
                            opened={!!form.errors.transaction_mode_id}
                            px={16}
                            py={2}
                            bg="orange.8"
                            c="white"
                            withArrow
                            offset={{ mainAxis: 5, crossAxis: -364 }}
                            zIndex={999}
                            transitionProps={{
                                transition: "pop-bottom-left",
                                duration: 500,
                            }}
                        >
                            <Carousel
                                id='transaction-mode-carousel'
                                slideSize="20%"
                                slideGap="es"
                                align="start"
                                height={60}
                                withIndicators={false}
                                controlSize={28}
                                controlsOffset={2}
                                emblaOptions={{ align: 'start', slidesToScroll: 3 }}
                            >
                                {transactionModeData?.map((mode) => (
                                    <Carousel.Slide key={mode.id}>
                                        <Box
                                            onClick={() => {
                                                handleTransactionModel(mode.id, mode.name);
                                            }}
                                            pos="relative"
                                            className={isThisTableSplitPaymentActive ? "cursor-not-allowed" : "cursor-pointer"}
                                        >
                                            <Flex
                                                bg={mode.id === form.values.transaction_mode_id ? "green.8" : "white"}
                                                direction="column"
                                                align="center"
                                                justify="center"
                                                c="black"
                                                p={3}
                                            >
                                                <Tooltip
                                                    label={mode.name}
                                                    withArrow
                                                    px={16}
                                                    py={2}
                                                    offset={2}
                                                    zIndex={999}
                                                    position="top"
                                                    color="red"
                                                >
                                                    <Image
                                                        w={80}
                                                        fit="contain"
                                                        alt={mode.name}
                                                        src={mode.path}
                                                        fallbackSrc={`https://placehold.co/120x80/FFFFFF/2f9e44?text=${mode.name}`}
                                                    />
                                                </Tooltip>
                                            </Flex>
                                        </Box>
                                    </Carousel.Slide>
                                ))}
                            </Carousel>
                        </Tooltip>
                    </Box>
                </Grid.Col>
                <Grid.Col span={3} style={{ textAlign: "right" }} pr="8">
                    <Tooltip
                        label={t("TransactionMode")}
                        px={16}
                        py={2}
                        bg="gry.8"
                        c="white"
                        withArrow
                        zIndex={999}
                        transitionProps={{
                            transition: "pop-bottom-left",
                            duration: 500,
                        }}
                    >
                        <ActionIcon
                            name="splitPayment"
                            size="xl"
                            bg={isThisTableSplitPaymentActive ? "green.6" : "gray.8"}
                            variant="filled"
                            onClick={handleOpenSplitPaymentDrawer}
                            disabled={!invoiceData?.length}
                        >
                            <IconScissors style={{ width: "70%", height: "70%" }} stroke={1.5} />
                        </ActionIcon>
                    </Tooltip>
                </Grid.Col>
            </Grid>

            {/* =============== split payments drawer ================ */}
            <SplitPaymentsDrawer
                opened={splitPaymentDrawerOpened}
                onClose={() => form.setFieldValue("split_payment_drawer_opened", false)}
                totalAmount={Math.round(getCartTotal()) - (form.values.discount ?? 0)}
                onSave={handleSaveSplitPayments}
                onRemove={clearTableSplitPayment}
                existingSplitPayments={splitPayments}
            />
        </>
    )
}
