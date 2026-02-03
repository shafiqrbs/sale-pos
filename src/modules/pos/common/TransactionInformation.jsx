import React from 'react'
import useConfigData from '@hooks/useConfigData';
import { ActionIcon, Grid, Box, Flex, Group, Image, ScrollArea, Stack, Text, Tooltip } from '@mantine/core'
import { IconChevronLeft, IconChevronRight, IconScissors, IconX } from '@tabler/icons-react';
import { calculateVATAmount } from '@utils/index';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import useCartOperation from '@hooks/useCartOperation';

export default function TransactionInformation({ form, transactionModeData }) {
    const { invoiceData, getCartTotal } = useCartOperation();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const { t } = useTranslation();
    const returnOrDueText = getCartTotal() < form.values.receive_amount ? "Return" : "Due";

    // ========= wreckages start =============
    const discountType = "Flat";
    const showLeftArrow = true;
    const showRightArrow = true;
    const isThisTableSplitPaymentActive = false;
    const clearTableSplitPayment = () => { };
    const handleClick = () => { };
    // ========= wreckages stop =============

    const handleTransactionModel = (id, name) => {
        form.setFieldValue("transaction_mode_id", id);
        form.setFieldValue("transaction_mode_name", name);
    };

    const totalAmount = Math.round(getCartTotal()) - (form.values.discount ?? 0);
    const dueAmount = totalAmount - form.values.receive_amount;
    return (
        <>
            <Grid
                columns={13}
                gutter={4}
                justify="center"
                align="center"
                pb={4}
                bg={"gray.1"}
            >
                <Grid.Col span={7} px={4}>
                    <Grid bg={"gray.1"} px={4}>
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
                style={{
                    borderRadius: 4,
                    border: form.errors.transaction_mode_id && !"transactionModeId" ? "1px solid red" : "none",
                }}
            >
                <Grid.Col span={21}>
                    <Box mr={4} style={{ position: "relative" }}>
                        <ScrollArea
                            type="never"
                            pl={"1"}
                            scrollbars="x"
                            pr={"2"}
                            w={450}
                        >
                            <Tooltip
                                label={t("TransactionMode")}
                                opened={!!form.errors.transaction_mode_id}
                                px={16}
                                py={2}
                                bg={"orange.8"}
                                c={"white"}
                                withArrow
                                offset={{ mainAxis: 5, crossAxis: -364 }}
                                zIndex={999}
                                transitionProps={{
                                    transition: "pop-bottom-left",
                                    duration: 500,
                                }}
                            >
                                <Group m={0} py={8} justify="flex-start" align="flex-start" gap="0" wrap="nowrap">
                                    {transactionModeData?.map((mode, index) => (
                                        <Box
                                            onClick={() => {
                                                handleTransactionModel(mode.id, mode.name);
                                            }}
                                            key={index}
                                            p={4}
                                            style={{
                                                position: "relative",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Flex
                                                bg={mode.id === form.values.transaction_mode_id ? "green.8" : "white"}
                                                direction="column"
                                                align="center"
                                                justify="center"
                                                p={2}
                                                style={{
                                                    color: "black",
                                                }}
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
                                                        w={56}
                                                        h={48}
                                                        fit="fit"
                                                        alt={mode.name}
                                                        src={isOnline ? mode.path : `./transactions/${mode.name}.jpg`}
                                                        fallbackSrc={`https://placehold.co/120x80/FFFFFF/2f9e44`}
                                                    />
                                                </Tooltip>
                                            </Flex>
                                        </Box>
                                    ))}
                                </Group>
                            </Tooltip>
                        </ScrollArea>

                        {showLeftArrow && (
                            <ActionIcon
                                variant="filled"
                                color="gray.2"
                                radius="xl"
                                size="lg"
                                h={24}
                                w={24}
                                style={{
                                    position: "absolute",
                                    left: -5,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                                onClick={() => scroll("left")}
                            >
                                <IconChevronLeft height={18} width={18} stroke={2} color="black" />
                            </ActionIcon>
                        )}
                        {showRightArrow && (
                            <ActionIcon
                                variant="filled"
                                color="gray.2"
                                radius="xl"
                                size="lg"
                                h={24}
                                w={24}
                                style={{
                                    position: "absolute",
                                    right: 5,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                }}
                                onClick={() => scroll("right")}
                            >
                                <IconChevronRight height={18} width={18} stroke={2} color="black" />
                            </ActionIcon>
                        )}
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
                            name={isThisTableSplitPaymentActive ? "clearSplitPayment" : "splitPayment"}
                            size="xl"
                            bg={isThisTableSplitPaymentActive ? "red.6" : "gray.8"}
                            variant="filled"
                            onClick={(e) => {
                                if (isThisTableSplitPaymentActive) {
                                    clearTableSplitPayment("currentTableKey");
                                } else {
                                    handleClick(e);
                                }
                            }}
                        >
                            {isThisTableSplitPaymentActive ? (
                                <IconX style={{ width: "70%", height: "70%" }} stroke={1.5} />
                            ) : (
                                <IconScissors style={{ width: "70%", height: "70%" }} stroke={1.5} />
                            )}
                        </ActionIcon>
                    </Tooltip>
                </Grid.Col>
            </Grid>
        </>
    )
}
