import React, { useMemo } from "react";
import {
    Box,
    Button,
    Flex,
    Grid,
    NumberInput,
    Select,
    Text,
    Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconPercentage, IconCurrencyTaka } from "@tabler/icons-react";
import useConfigData from "@hooks/useConfigData";
import VendorInfoSection from "./VendorInfoSection";
import useTransactionMode from "@hooks/useTransactionMode";

export default function PaymentSection({ purchaseForm, itemsTotal }) {
    const { transactionMode } = useTransactionMode();
    const { configData } = useConfigData();
    const currencySymbol = configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

    const {
        discountAmount,
        isDiscountPercentage,
        purchaseDate,
        purchaseNarration,
        paymentAmount,
    } = purchaseForm.values;

    const vatAmount = 0;

    const discountValue = useMemo(() => {
        if (!discountAmount) {
            return 0;
        }

        if (isDiscountPercentage) {
            return (itemsTotal * discountAmount) / 100;
        }

        return discountAmount;
    }, [ discountAmount, isDiscountPercentage, itemsTotal ]);

    const grandTotal = useMemo(
        () => Math.max(itemsTotal - discountValue + vatAmount, 0),
        [ itemsTotal, discountValue ]
    );

    const dueAmount = useMemo(
        () => Math.max(grandTotal - (paymentAmount || 0), 0),
        [ grandTotal, paymentAmount ]
    );

    return (
        <>
            <Grid columns={24} gutter={8} mt="xs">
                <Grid.Col span={16}>
                    <Grid columns={16} gutter={8}>
                        <Grid.Col span={16}>
                            <VendorInfoSection
                                purchaseForm={purchaseForm}
                            />
                        </Grid.Col>

                        <Grid.Col span={8}>
                            <Box
                                bd="1px solid #dee2e6"
                                bg="white"
                                p="xs"
                                className="borderRadiusAll"
                                h="100%"
                            >
                                <Text fz="sm" fw={600} mb={6}>
                                    Transaction mode
                                </Text>
                                <Select
                                    data={transactionMode.map((mode) => ({
                                        value: String(mode.id),
                                        label: mode.name,
                                    }))}
                                    value={purchaseForm.values.transactionModeId}
                                    onChange={(value, option) => {
                                        purchaseForm.setFieldValue("transactionMode", option.label)
                                        purchaseForm.setFieldValue("transactionModeId", String(value))
                                    }}
                                    placeholder="Select transaction mode"
                                    size="xs"
                                />
                            </Box>
                        </Grid.Col>

                        <Grid.Col span={8}>
                            <Box
                                bd="1px solid #dee2e6"
                                bg="white"
                                p="xs"
                                className="borderRadiusAll"
                            >
                                <Grid gutter={6}>
                                    <Grid.Col span={12}>
                                        <DateInput
                                            value={purchaseDate}
                                            onChange={(value) =>
                                                purchaseForm.setFieldValue("purchaseDate", value)
                                            }
                                            valueFormat="MMMM D, YYYY"
                                            size="xs"
                                            label={null}
                                            placeholder="Select date"
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={12}>
                                        <Textarea
                                            value={purchaseNarration}
                                            onChange={(event) =>
                                                purchaseForm.setFieldValue(
                                                    "purchaseNarration",
                                                    event.currentTarget.value
                                                )
                                            }
                                            placeholder="Narration"
                                            size="xs"
                                            minRows={2}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Box>
                        </Grid.Col>
                    </Grid>
                </Grid.Col>

                <Grid.Col span={8}>
                    <Box
                        bd="1px solid #dee2e6"
                        bg="white"
                        p="xs"
                        className="borderRadiusAll"
                        h="100%"
                    >
                        <Grid columns={24} gutter={{ base: 4 }}>
                            <Grid.Col span={8}>
                                <Box
                                    bg="var(--theme-primary-color-0)"
                                    className="borderRadiusAll"
                                    px="xs"
                                    py={4}
                                >
                                    <Text fz={11} fw={500}>
                                        Discount
                                    </Text>
                                    <Flex align="center" gap={4}>
                                        <Text fz={11}>{currencySymbol}</Text>
                                        <Text fz={12} fw={600}>
                                            {discountValue.toFixed(2)}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Grid.Col>
                            <Grid.Col span={8}>
                                <Box
                                    bg="var(--theme-primary-color-0)"
                                    className="borderRadiusAll"
                                    px="xs"
                                    py={4}
                                >
                                    <Text fz={11} fw={500}>
                                        Vat
                                    </Text>
                                    <Flex align="center" gap={4}>
                                        <Text fz={11}>{currencySymbol}</Text>
                                        <Text fz={12} fw={600}>
                                            {vatAmount.toFixed(2)}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Grid.Col>
                            <Grid.Col span={8}>
                                <Box
                                    bg="var(--theme-primary-color-0)"
                                    className="borderRadiusAll"
                                    px="xs"
                                    py={4}
                                >
                                    <Text fz={11} fw={500}>
                                        Total
                                    </Text>
                                    <Flex align="center" gap={4}>
                                        <Text fz={11}>{currencySymbol}</Text>
                                        <Text fz={12} fw={700}>
                                            {grandTotal.toFixed(2)}
                                        </Text>
                                    </Flex>
                                </Box>
                            </Grid.Col>
                        </Grid>

                        <Flex
                            mt="xs"
                            justify="space-between"
                            align="center"
                            gap={6}
                        >
                            <Box sx={{ flex: 1 }}>
                                <NumberInput
                                    value={discountAmount}
                                    onChange={(value) =>
                                        purchaseForm.setFieldValue(
                                            "discountAmount",
                                            typeof value === "string"
                                                ? parseFloat(value) || 0
                                                : value || 0
                                        )
                                    }
                                    size="xs"
                                    placeholder="Discount"
                                    leftSection={<IconCurrencyTaka size={14} />}
                                />
                            </Box>
                            <Button
                                variant={isDiscountPercentage ? "filled" : "outline"}
                                color="var(--theme-warn-color-6)"
                                size="xs"
                                px={8}
                                onClick={() =>
                                    purchaseForm.setFieldValue(
                                        "isDiscountPercentage",
                                        !isDiscountPercentage
                                    )
                                }
                                leftSection={<IconPercentage size={14} />}
                            >
                                %
                            </Button>
                        </Flex>

                        <Flex
                            mt="xs"
                            direction="column"
                            gap={6}
                            bg="var(--theme-primary-color-6)"
                            className="borderRadiusAll"
                            px="xs"
                            py={6}
                        >
                            <Flex justify="space-between" align="center">
                                <Text fz="sm" fw={600} c="white">
                                    Due
                                </Text>
                                <Flex align="center" gap={4}>
                                    <Text fz="sm" fw={500} c="white">
                                        {currencySymbol}
                                    </Text>
                                    <Text fz="sm" fw={700} c="white">
                                        {dueAmount.toFixed(2)}
                                    </Text>
                                </Flex>
                            </Flex>
                            <NumberInput
                                value={paymentAmount}
                                onChange={(value) =>
                                    purchaseForm.setFieldValue(
                                        "paymentAmount",
                                        typeof value === "string"
                                            ? parseFloat(value) || 0
                                            : value || 0
                                    )
                                }
                                size="xs"
                                placeholder="Amount"
                                leftSection={<IconCurrencyTaka size={14} />}
                                styles={{
                                    input: {
                                        backgroundColor: "white",
                                    },
                                }}
                            />
                        </Flex>
                    </Box>
                </Grid.Col>
            </Grid>

            <Button.Group mt="xs">
                <Button
                    fullWidth
                    bg="var(--theme-reset-btn-color)"
                    color="white"
                    radius={0}
                    type="button"
                >
                    Reset
                </Button>
                <Button
                    fullWidth
                    bg="var(--theme-hold-btn-color)"
                    color="white"
                    radius={0}
                    type="button"
                >
                    Hold
                </Button>
                <Button
                    fullWidth
                    bg="var(--theme-print-btn-color)"
                    color="white"
                    radius={0}
                    type="button"
                >
                    Print
                </Button>
                <Button
                    fullWidth
                    bg="var(--theme-pos-btn-color)"
                    color="white"
                    radius={0}
                    type="button"
                >
                    Pos
                </Button>
                <Button
                    fullWidth
                    bg="var(--theme-save-btn-color)"
                    color="white"
                    radius={0}
                    type="submit"
                >
                    Save
                </Button>
            </Button.Group>
        </>
    );
}

