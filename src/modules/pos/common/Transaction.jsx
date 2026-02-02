import SelectForm from '@components/form-builders/SelectForm';
import { ActionIcon, Box, Button, Grid, Group, NumberInput, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { IconChefHat, IconDeviceFloppy, IconPlusMinus, IconPrinter, IconTicket, IconUserPlus } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import TransactionInformation from './TransactionInformation';
import useCartOperation from '@hooks/useCartOperation';
import { showNotification } from '@components/ShowNotificationComponent';
import { useOutletContext } from 'react-router';
import useConfigData from '@hooks/useConfigData';
import { formatDate, generateInvoiceId, withInvoiceId } from '@utils/index';
import { useInlineUpdateMutation, useSalesCompleteMutation } from '@services/pos';
import CustomerDrawer from '@components/modals/CustomerDrawer';
import { useDisclosure } from '@mantine/hooks';
import FormValidationWrapper from '@components/form-builders/FormValidationWrapper';

export default function Transaction({ form, transactionModeData, tableId = null }) {
    const { t } = useTranslation();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const [ coreUsers, setCoreUsers ] = useState([])
    const { invoiceData, getCartTotal, refetchInvoice } = useCartOperation();
    const [ isLoading, setIsLoading ] = useState({ saveAll: false, save: false, print: false })
    const [ inlineUpdate ] = useInlineUpdateMutation();
    const [ salesComplete ] = useSalesCompleteMutation();
    const [ customersDropdownData, setCustomersDropdownData ] = useState([]);
    const [ customerDrawerOpened, { open: customerDrawerOpen, close: customerDrawerClose } ] = useDisclosure(false);
    const [ customerObject, setCustomerObject ] = useState(null);

    // ============= wreckage start =============
    const discountType = "Flat";
    const isThisTableSplitPaymentActive = false;
    const handleClick = () => { };
    const enableTable = false;
    const salesByUser = "";
    const enableCoupon = "Coupon";
    const setEnableCoupon = () => { };
    const salesDiscountAmount = 0;
    const isSplitPaymentActive = false;
    // ============= wreckage stop ==============

    useEffect(() => {
        async function fetchCoreUsers() {
            const data = await window.dbAPI.getDataFromTable("core_users");
            setCoreUsers(data);
        }
        fetchCoreUsers();
    }, []);

    async function fetchCustomers() {
        const data = await window.dbAPI.getDataFromTable("core_customers");
        setCustomersDropdownData(data);
    }

    useEffect(() => {
        const cartTotal = getCartTotal();
        form.setFieldValue("receive_amount", Math.round(cartTotal));
    }, [ getCartTotal() ]);

    useEffect(() => {
        fetchCustomers();
    }, []);

    // =============== refresh customers when drawer closes ================
    useEffect(() => {
        if (!customerDrawerOpened) {
            fetchCustomers();
        }
    }, [ customerDrawerOpened ]);

    // =============== handle customer selection from drawer ================
    const handleCustomerSelect = (customer) => {
        if (customer) {
            setCustomerObject(customer);
        } else {
            setCustomerObject(null);
        }
    };

    const handleCustomerAdd = () => {
        customerDrawerOpen();
    };
    const handleSave = async ({ withPos = false }) => {
        // Validation checks
        if (!invoiceData?.length) {
            showNotification(t("NoProductAdded"), "red", "", "", true, 1000, true);
            return;
        }

        // =============== check if any quantity is 0 ================
        const hasZeroQuantity = invoiceData.some(item => !item.quantity || item.quantity <= 0);
        if (hasZeroQuantity) {
            showNotification("Quantity can't be 0, check your cart", "red", "", "", true, 2000, true);
            return;
        }

        // if (!salesByUser || salesByUser === "undefined") {
        // 	showNotificationComponent(t("ChooseUser"), "red", "", "", true, 1000, true);
        // 	return;
        // }

        // if (!invoiceData.transaction_mode_id && !isSplitPaymentActive) {
        // 	showNotificationComponent(t("ChooseTransactionMode"), "red", "", "", true, 1000, true);
        // 	return;
        // }

        // if (!invoiceData.payment && !isSplitPaymentActive) {
        //     showNotificationComponent(t("PaymentAmount"), "red", "", "", true, 1000, true);
        //     return;
        // }

        setIsLoading({ ...isLoading, save: true });

        try {
            const fullAmount = form.values.receive_amount;

            // if (isOnline) {
            //     await handleOnlineSave(fullAmount);
            // } else {
            await handleOfflineSave(fullAmount);
            // }

            showNotification(t("SalesComplete"), "blue", "", "", true, 1000, true);
            setCustomerObject(null);
            form.reset();
            form.setFieldValue("transaction_mode_id", transactionModeData[ 0 ]?.id ?? "");
            form.setFieldValue("transaction_mode_name", transactionModeData[ 0 ]?.name ?? "");

            if (withPos) {
                const setup = await window.dbAPI.getDataFromTable("printer");
                if (!setup?.printer_name) {
                    return showNotification(t("PrinterNotSetup"), "red", "", "", true, 1000, true);
                }
                const status = await window.deviceAPI.thermalPrint({
                    configData,
                    salesItems: invoiceData,
                    salesViewData: {},
                    setup,
                });

                if (!status?.success) {
                    showNotification(t("PrintingFailed"), "red", "", "", true, 1000, true);
                    return;
                }
            }
        } catch (err) {
            console.error("Error saving sale:", err);
        } finally {
            setIsLoading({ ...isLoading, save: false });
        }
    };

    const handleOnlineSave = async (fullAmount) => {
        if (isSplitPaymentActive) {
            inlineUpdate({
                ...withInvoiceId(tableId),
                field_name: "amount",
                value: fullAmount,
            })
        }

        const resultAction = await salesComplete({
            invoice_id: invoiceData.id,
        });

        if (resultAction.error) {
            showNotification(t("FailedToCompleteOnlineSale"), "red", "", "", true, 1000, true);
            return;
        }
    };

    const handleOfflineSave = async (fullAmount) => {
        // =============== get customer info from database or customerObject ================
        const customerInfo = customerObject || customersDropdownData.find((d) => d.id?.toString() == form.values.customer_id);
        const invoiceId = generateInvoiceId();
        const salesBy = coreUsers.find((user) => user.id == form.values.sales_by_id);

        const salesData = {
            invoice: invoiceId,
            sub_total: getCartTotal(),
            total: Math.round(getCartTotal()),
            approved_by_id: form.values.sales_by_id,
            payment: fullAmount,
            discount: 0,
            discount_calculation: 0,
            discount_type: form.values.discount_type,
            customerId: form.values.customer_id,
            customerName: customerInfo?.name || customerInfo?.label?.split(" -- ")[ 1 ],
            customerMobile: customerInfo?.mobile || customerInfo?.label?.split(" -- ")[ 0 ],
            customer_address: customerInfo?.address || "",
            createdByUser: "Sandra",
            createdById: form.values.sales_by_id,
            salesById: form.values.sales_by_id,
            salesByUser: salesBy?.username,
            salesByName: salesBy?.name,
            process: "approved",
            mode_name: form.values.transaction_mode_name,
            created: formatDate(new Date()),
            sales_items: JSON.stringify(invoiceData),
            multi_transaction: isSplitPaymentActive ? 1 : 0,
        }

        // Insert sale record
        await window.dbAPI.upsertIntoTable("sales", salesData);

        // Handle transactions
        // if (isSplitPaymentActive) {
        //     const splitPayments = tableSplitPaymentMap[ tableId || "general" ] || [];
        //     for (const payment of splitPayments) {
        //         await window.dbAPI.upsertIntoTable("sales_transactions", {
        //             transaction_mode_id: payment.transaction_mode_id,
        //             invoice_id: invoiceId,
        //             amount: payment.partial_amount,
        //             remarks: payment.remarks || "",
        //         });
        //     }
        // } else {
        //     await window.dbAPI.upsertIntoTable("sales_transactions", {
        //         transaction_mode_id: transactionModeId,
        //         invoice_id: invoiceId,
        //         amount: fullAmount,
        //         remarks: "",
        //     });
        // }

        // Clear invoice table
        await window.dbAPI.updateDataInTable("invoice_table", {
            id: tableId,
            data: {
                sales_by_id: null,
                transaction_mode_id: null,
                customer_id: null,
                is_active: 0,
                sub_total: null,
                payment: null,
            },
        });

        // Delete invoice items
        const ids = invoiceData.map(item => item.id);
        await window.dbAPI.deleteManyFromTable("invoice_table_item", ids);

        // reset invoice redux store
        refetchInvoice();
    };

    const handlePrintAll = async () => {
        // =============== first save the sale ================
        await handleSave({ withPos: false });

        // =============== then handle kitchen printing ================
        // if (invoiceData?.invoice_items?.length > 0) {
        //     // =============== determine kitchen products based on category or product type ================
        //     const kitchenProducts = getKitchenProducts(invoiceData.invoice_items);

        //     if (kitchenProducts.length > 0) {
        //         // =============== trigger kitchen print ================
        //         // =============== this will open the kitchen print drawer ================
        //         handleClick({ currentTarget: { name: "kitchen" } });
        //     }
        // }
    };

    return (
        <Stack bg="gray.0" align="stretch" justify="center" mt={6} gap={4} pl={4} pr={2} mb={0}>
            <TransactionInformation form={form} transactionModeData={transactionModeData} />
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
                    searchable
                    color="orange.8"
                    position="top-start"
                    style={{ width: "100%" }}
                />
                {enableTable && (
                    <FormValidationWrapper
                        errorMessage={t("SelectProductandUser")}
                        opened={!!form.errors.sales_by_id}
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
                    </FormValidationWrapper>
                )}
            </Group>
            <Box m={0} mb={"12"}>
                <Grid columns={24} gutter={{ base: 8 }} pr={"2"} align="center" justify="center">
                    <Grid.Col span={6}>
                        <FormValidationWrapper
                            errorMessage={t("ChooseCustomer")}
                            opened={!!form.errors.customer_id}
                        >
                            <Button
                                fullWidth
                                size="sm"
                                color="#0077b6"
                                leftSection={
                                    customerObject?.name ? (
                                        <></>
                                    ) : (
                                        <IconUserPlus height={14} width={14} stroke={2} />
                                    )
                                }
                                onClick={handleCustomerAdd}
                            >
                                <Stack gap={0}>
                                    <Text fw={600} size="xs">
                                        {customerObject?.name ? customerObject?.name : t("Customer")}
                                    </Text>
                                    <Text size="xs">{customerObject?.mobile}</Text>
                                </Stack>
                            </Button>
                        </FormValidationWrapper>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <FormValidationWrapper
                            errorMessage={t("ClickRightButtonForPercentFlat")}
                            opened={!!form.errors.coupon_code}
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
                        </FormValidationWrapper>
                    </Grid.Col>
                    <Grid.Col span={6} bg="red.3">
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
                                        <FormValidationWrapper
                                            errorMessage={t("CouponCode")}
                                            opened={!!form.errors.coupon_code}
                                            position="left"
                                        >
                                            <IconTicket size={16} opacity={0.5} />
                                        </FormValidationWrapper>
                                    </>
                                }
                            />
                        ) : (
                            <FormValidationWrapper
                                errorMessage={t("ClickRightButtonForPercentFlat")}
                                opened={!!form.errors.coupon_code}
                                position="left"
                            >
                                <TextInput
                                    type="number"
                                    style={{ textAlign: "right" }}
                                    placeholder={t("Discount")}
                                    value={salesDiscountAmount}
                                    error={form.errors.discount}
                                    size="sm"
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
                                        >
                                            {discountType === "Flat" ? (
                                                <IconCurrencyTaka size={16} />
                                            ) : (
                                                <IconPercentage size={16} />
                                            )}
                                        </ActionIcon>
                                    }
                                />
                            </FormValidationWrapper>
                        )}
                    </Grid.Col>
                    <Grid.Col span={6} bg="green">
                        <FormValidationWrapper
                            errorMessage={t("ReceiveAmountValidateMessage")}
                            opened={!!form.errors.receive_amount}
                        >
                            <NumberInput
                                allowNegative={false}
                                hideControls
                                decimalScale={3}
                                placeholder={isThisTableSplitPaymentActive ? t("SplitPaymentActive") : t("Amount")}
                                value={form.values.receive_amount}
                                error={form.errors.receive_amount}
                                size="sm"
                                disabled={isThisTableSplitPaymentActive}
                                leftSection={<IconPlusMinus size={16} opacity={0.5} />}
                                onChange={(value) => {
                                    form.setFieldValue("receive_amount", value);
                                }}
                            />
                        </FormValidationWrapper>
                    </Grid.Col>
                </Grid>
            </Box>
            <Grid columns={12} gutter={{ base: 2 }}>
                <Grid.Col span={4}>
                    <FormValidationWrapper
                        errorMessage={t("PrintAll")}
                        opened={!!form.errors.print_all}
                    >
                        <Button
                            bg="white"
                            variant="outline"
                            c="black"
                            color="gray"
                            size="lg"
                            fullWidth={true}
                            onClick={handlePrintAll}
                        >
                            <Text fz="md">{t("AllPrint")}</Text>
                        </Button>
                    </FormValidationWrapper>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Button
                        // disabled={isDisabled}
                        bg="#264653"
                        c="white"
                        size="lg"
                        fullWidth={true}
                        leftSection={<IconPrinter />}
                        onClick={() => handleSave({ withPos: true })}
                    >
                        {t("Pos")}
                    </Button>
                </Grid.Col>
                <Grid.Col span={4}>
                    <Button
                        size="lg"
                        c="white"
                        bg="#38b000"
                        fullWidth={true}
                        leftSection={<IconDeviceFloppy />}
                        onClick={() => handleSave({ withPos: false })}
                    >
                        {t("Save")}
                    </Button>
                </Grid.Col>
            </Grid>

            {/* =============== customer drawer ================ */}
            <CustomerDrawer
                opened={customerDrawerOpened}
                onClose={customerDrawerClose}
                form={form}
                customersDropdownData={customersDropdownData}
                onCustomerSelect={handleCustomerSelect}
            />
        </Stack>
    )
}