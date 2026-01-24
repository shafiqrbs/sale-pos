import SelectForm from '@components/form-builders/SelectForm';
import { ActionIcon, Box, Button, Grid, Group, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { IconChefHat, IconDeviceFloppy, IconPlusMinus, IconPrinter, IconTicket, IconUserPlus } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import TransactionInformation from './TransactionInformation';

export default function Transaction({ form, transactionModeData, invoiceData }) {
    const { t } = useTranslation();
    const discountType = "Flat";
    const [ coreUsers, setCoreUsers ] = useState([])

    const isThisTableSplitPaymentActive = false;
    const handleClick = () => { };
    const enableTable = false;
    const salesByUser = "";
    const customerObject = {};
    const handleCustomerAdd = () => { };
    const enableCoupon = "Coupon";
    const setEnableCoupon = () => { };
    const salesDiscountAmount = 0;

    useEffect(() => {
        async function fetchCoreUsers() {
            const data = await window.dbAPI.getDataFromTable("core_users");
            setCoreUsers(data);
        }
        fetchCoreUsers();
    }, []);

    return (
        <Stack bg="gray.0" align="stretch" justify="center" mt={6} gap={4} pl={4} pr={2} mb={0}>
            <TransactionInformation form={form} transactionModeData={transactionModeData} invoiceData={invoiceData} />
            <Group gap={6} mb={4} preventGrowOverflow={false} grow align="center" wrap="nowrap">
                <SelectForm
                    pt="4"
                    label=""
                    tooltip="SalesBy"
                    placeholder={t("OrderTakenBy")}
                    name="sales_by_id"
                    form={form}
                    dropdownValue={coreUsers.map((user) => ({ label: user.name, value: user.id?.toString() }))}
                    id="sales_by_id"
                    searchable={true}
                    color="orange.8"
                    position="top-start"
                    inlineUpdate={true}
                    style={{ width: "100%" }}
                />
                {enableTable && (
                    <Tooltip
                        disabled={!(invoiceData?.invoice_items?.length === 0 || !salesByUser)}
                        color="red.6"
                        withArrow
                        px={16}
                        py={2}
                        offset={2}
                        zIndex={999}
                        position="top-end"
                        label={t("SelectProductandUser")}
                    >
                        <Button
                            disabled={invoiceData?.invoice_items?.length === 0 || !salesByUser}
                            radius="sm"
                            size="sm"
                            color="green"
                            name="kitchen"
                            mt={4}
                            miw={122}
                            maw={122}
                            leftSection={<IconChefHat height={14} width={14} stroke={2} />}
                            onClick={handleClick}
                        >
                            <Text fw={600} size="sm">
                                {t("Kitchen")}
                            </Text>
                        </Button>
                    </Tooltip>
                )}
            </Group>
            <Box m={0} mb={"12"}>
                <Grid columns={24} gutter={{ base: 8 }} pr={"2"} align="center" justify="center">
                    <Grid.Col span={6}>
                        <Tooltip
                            label={t("ChooseCustomer")}
                            opened={!!form.errors.customer_id}
                            bg={"orange.8"}
                            c={"white"}
                            withArrow
                            px={16}
                            py={2}
                            offset={2}
                            zIndex={999}
                            transitionProps={{
                                transition: "pop-bottom-left",
                                duration: 500,
                            }}
                        >
                            <Button
                                disabled={!"tableId"}
                                fullWidth
                                size="sm"
                                color="#0077b6"
                                leftSection={
                                    customerObject && customerObject.name ? (
                                        <></>
                                    ) : (
                                        <IconUserPlus height={14} width={14} stroke={2} />
                                    )
                                }
                                onClick={handleCustomerAdd}
                            >
                                <Stack gap={0}>
                                    <Text fw={600} size="xs">
                                        {customerObject && customerObject.name ? customerObject.name : t("Customer")}
                                    </Text>
                                    <Text size="xs">{customerObject && customerObject.mobile}</Text>
                                </Stack>
                            </Button>
                        </Tooltip>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Tooltip
                            label={t("ClickRightButtonForPercentFlat")}
                            px={16}
                            py={2}
                            position="top"
                            bg={"red.4"}
                            c={"white"}
                            withArrow
                            offset={2}
                            zIndex={999}
                            transitionProps={{
                                transition: "pop-bottom-left",
                                duration: 500,
                            }}
                        >
                            <Button
                                fullWidth={true}
                                onClick={() =>
                                    enableCoupon === "Coupon" ? setEnableCoupon("Discount") : setEnableCoupon("Coupon")
                                }
                                variant="filled"
                                fz={"xs"}
                                leftSection={
                                    enableCoupon === "Coupon" ? <IconTicket size={14} /> : <IconPercentage size={14} />
                                }
                                color="gray"
                            >
                                {enableCoupon === "Coupon" ? t("Coupon") : t("Discount")}
                            </Button>
                        </Tooltip>
                    </Grid.Col>
                    <Grid.Col span={6} bg={"red.3"}>
                        {enableCoupon === "Coupon" ? (
                            <TextInput
                                type="text"
                                placeholder={t("CouponCode")}
                                value={form.values.coupon_code}
                                error={form.errors.coupon_code}
                                size={"sm"}
                                onChange={(event) => {
                                    form.setFieldValue("coupon_code", event.target.value);
                                }}
                                rightSection={
                                    <>
                                        <Tooltip
                                            label={t("CouponCode")}
                                            px={16}
                                            py={2}
                                            withArrow
                                            position={"left"}
                                            c={"black"}
                                            bg={`gray.1`}
                                            transitionProps={{
                                                transition: "pop-bottom-left",
                                                duration: 500,
                                            }}
                                        >
                                            <IconTicket size={16} opacity={0.5} />
                                        </Tooltip>
                                    </>
                                }
                            />
                        ) : (
                            <Tooltip
                                label={t("ClickRightButtonForPercentFlat")}
                                px={16}
                                py={2}
                                position="top"
                                bg={"red.4"}
                                c={"white"}
                                withArrow
                                offset={2}
                                zIndex={999}
                                transitionProps={{
                                    transition: "pop-bottom-left",
                                    duration: 500,
                                }}
                            >
                                <TextInput
                                    type="number"
                                    style={{ textAlign: "right" }}
                                    placeholder={t("Discount")}
                                    value={salesDiscountAmount}
                                    error={form.errors.discount}
                                    size={"sm"}
                                    onChange={(event) => {
                                        form.setFieldValue("discount", event.target.value);
                                        const newValue = event.target.value;
                                        form.setFieldValue("discount", newValue);
                                    }}
                                    rightSection={
                                        <ActionIcon
                                            size={32}
                                            bg={"red.5"}
                                            variant="filled"
                                        // onClick={handleDiscount}
                                        >
                                            {discountType === "Flat" ? (
                                                <IconCurrencyTaka size={16} />
                                            ) : (
                                                <IconPercentage size={16} />
                                            )}
                                        </ActionIcon>
                                    }
                                />
                            </Tooltip>
                        )}
                    </Grid.Col>
                    <Grid.Col span={6} bg={"green"}>
                        <Tooltip
                            label={t("ReceiveAmountValidateMessage")}
                            opened={!!form.errors.receive_amount}
                            px={16}
                            py={2}
                            position="top-end"
                            bg="#90e0ef"
                            c="white"
                            withArrow
                            offset={2}
                            zIndex={999}
                            transitionProps={{
                                transition: "pop-bottom-left",
                                duration: 500,
                            }}
                        >
                            <TextInput
                                type="number"
                                placeholder={isThisTableSplitPaymentActive ? t("SplitPaymentActive") : t("Amount")}
                                // value={currentPaymentInput}
                                error={form.errors.receive_amount}
                                size={"sm"}
                                disabled={isThisTableSplitPaymentActive}
                                leftSection={<IconPlusMinus size={16} opacity={0.5} />}
                            // classNames={{ input: classes.input }}
                            // onChange={handlePaymentChange}
                            // onBlur={handlePaymentBlur}
                            />
                        </Tooltip>
                    </Grid.Col>
                </Grid>
            </Box>
            <Grid columns={12} gutter={{ base: 2 }}>
                <Grid.Col span={4}>
                    <Tooltip
                        label={t("PrintAll")}
                        px={16}
                        py={2}
                        color="red"
                        withArrow
                        offset={2}
                        zIndex={100}
                        transitionProps={{
                            transition: "pop-bottom-left",
                            duration: 2000,
                        }}
                    >
                        <Button
                            bg={"white"}
                            variant="outline"
                            c={"black"}
                            color="gray"
                            size={"lg"}
                            fullWidth={true}
                        // onClick={handlePrintAll}
                        >
                            <Text size="md">{t("AllPrint")}</Text>
                        </Button>
                    </Tooltip>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Button
                        // disabled={isDisabled}
                        bg={"#264653"}
                        c={"white"}
                        size={"lg"}
                        fullWidth={true}
                        leftSection={<IconPrinter />}
                    // onClick={() => handleSave({ withPos: true })}
                    >
                        {t("Pos")}
                    </Button>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Button
                        size={"lg"}
                        c={"white"}
                        bg={"#38b000"}
                        fullWidth={true}
                        leftSection={<IconDeviceFloppy />}
                    // onClick={() => handleSave({ withPos: false })}
                    >
                        {t("Save")}
                    </Button>
                </Grid.Col>
            </Grid>
        </Stack>
    )
}
