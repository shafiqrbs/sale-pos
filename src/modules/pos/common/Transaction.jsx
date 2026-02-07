import SelectForm from '@components/form-builders/SelectForm';
import { ActionIcon, Box, Button, Grid, Group, NumberInput, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { IconChefHat, IconDeviceFloppy, IconNumber123, IconPercentage, IconPlusMinus, IconPrinter, IconTicket, IconUserPlus } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import TransactionInformation from './TransactionInformation';
import useCartOperation from '@hooks/useCartOperation';
import { showNotification } from '@components/ShowNotificationComponent';
import { useOutletContext } from 'react-router';
import useConfigData from '@hooks/useConfigData';
import { formatDateTime, generateInvoiceId } from '@utils/index';
import CustomerDrawer from '@components/modals/CustomerDrawer';
import { useDisclosure } from '@mantine/hooks';
import FormValidationWrapper from '@components/form-builders/FormValidationWrapper';
import useLoggedInUser from '@hooks/useLoggedInUser';

export default function Transaction({ form, tableId = null }) {
    const user = useLoggedInUser();
    const { t } = useTranslation();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const [ coreUsers, setCoreUsers ] = useState([])
    const { invoiceData, getCartTotal, refetchInvoice } = useCartOperation();
    const [ isLoading, setIsLoading ] = useState({ saveAll: false, save: false, print: false })
    const [ customersDropdownData, setCustomersDropdownData ] = useState([]);
    const [ customerDrawerOpened, { open: customerDrawerOpen, close: customerDrawerClose } ] = useDisclosure(false);
    const [ customerObject, setCustomerObject ] = useState(null);
    const [ discountMode, setDiscountMode ] = useState("flat");
    const [ percentageValue, setPercentageValue ] = useState(0)

    const [ transactionModeData, setTransactionModeData ] = useState([]);

    // ============= wreckage start =============
    const enableTable = false;
    const salesByUser = "";
    const handleClick = () => { };
    // ============= wreckage stop ==============

    // =============== check if split payment is active ================
    const isSplitPaymentActive = form.values.multi_transaction === 1

    useEffect(() => {
        async function fetchTransactionData() {
            const data = await window.dbAPI.getDataFromTable("accounting_transaction_mode");
            setTransactionModeData(data);

            if (data.length) {
                const cashMethod = data.find(method => method.slug === "cash");

                form.setFieldValue("transaction_mode_id", cashMethod?.id);
                form.setFieldValue("transaction_mode_name", cashMethod?.name);
            }
        }
        fetchTransactionData();
    }, []);

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
        if (!isSplitPaymentActive) {
            const cartTotal = Math.round(getCartTotal()) - (form.values.discount ?? 0);
            form.setFieldValue("receive_amount", cartTotal);
        }
    }, [ getCartTotal(), form.values.discount, isSplitPaymentActive ]);

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
        const total = Math.round(getCartTotal()) - (form.values.discount ?? 0);

        // Validation checks
        if (!invoiceData?.length) {
            showNotification(t("NoProductAdded"), "red", "", "", true, 1000, true);
            return;
        }

        if (form.values.receive_amount < total) {
            showNotification(t("DuesAreNotAllowed"), "red", "", "", true, 1000, true);
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
            const responseSalesData = await handleOfflineSave(fullAmount);
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
                    configData: { ...configData, user },
                    salesItems: invoiceData,
                    salesViewData: responseSalesData,
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

    // =============== handle online save (currently disabled) ================
    // const handleOnlineSave = async (fullAmount) => {
    //     if (isSplitPaymentActive) {
    //         inlineUpdate({
    //             ...withInvoiceId(tableId),
    //             field_name: "amount",
    //             value: fullAmount,
    //         })
    //     }

    //     const resultAction = await salesComplete({
    //         invoice_id: invoiceData.id,
    //     });

    //     if (resultAction.error) {
    //         showNotification(t("FailedToCompleteOnlineSale"), "red", "", "", true, 1000, true);
    //         return;
    //     }
    // };

    const handleOfflineSave = async (fullAmount) => {
        // =============== get customer info from database or customerObject ================
        const customerInfo = customerObject || customersDropdownData.find((d) => d.id?.toString() == form.values.customer_id);
        const invoiceId = generateInvoiceId();
        const salesBy = coreUsers.find((user) => user.id == form.values.sales_by_id);

        const salesData = {
            invoice: invoiceId,
            sub_total: getCartTotal(),
            total: Math.round(getCartTotal() - form.values.discount),
            approved_by_id: form.values.sales_by_id,
            payment: fullAmount,
            discount: form.values.discount,
            discount_calculation: 0,
            discount_type: discountMode,
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
            created: formatDateTime(new Date()),
            sales_items: JSON.stringify(invoiceData),
            multi_transaction: isSplitPaymentActive ? 1 : 0,
            split_payments: isSplitPaymentActive ? JSON.stringify(form.values.split_payments) : null,
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

        return salesData;
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

    const handlePercentageChange = (value) => {
        setPercentageValue(value);

        const discount = (Math.round(getCartTotal()) * value) / 100;
        form.setFieldValue("discount", Math.round(discount));
    }

    const handleDiscountModeChange = () => {
        if (discountMode === "coupon") {
            setDiscountMode("discount");
            form.setFieldValue("discount_type", "flat");
            form.setFieldValue("coupon_code", "");
        } else {
            setDiscountMode("coupon");
            form.setFieldValue("discount_type", "coupon");
            form.setFieldValue("discount", 0);
        }
    }

    const toggleDiscountMode = () => {
        form.setFieldValue("discount", 0);
        setPercentageValue(0);
        const discountType = form.values.discount_type === "flat" ? "percentage" : "flat";
        form.setFieldValue("discount_type", discountType);
    }

    return (
        <Stack bg="gray.0" align="stretch" justify="center" mt={6} gap={4} pl={4} pr={2} mb={0}>
            {/* =============== transaction methods + split payment methods ================ */}
            <TransactionInformation form={form} transactionModeData={transactionModeData} />
            {/* =============== transaction methods + split payment methods end ================ */}

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
                            w={122}
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
                <Grid columns={24} gutter={{ base: 8 }} pr="2px" align="center" justify="center">
                    <Grid.Col span={6}>
                        <FormValidationWrapper
                            errorMessage={t("ChooseCustomer")}
                            opened={!!form.errors.customer_id}
                        >
                            <Button
                                fullWidth
                                size="sm"
                                color="#0077b6"
                                px="2xs"
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
                                onClick={handleDiscountModeChange}
                                variant="filled"
                                px="2xs"
                                fz="xs"
                                leftSection={
                                    discountMode === "coupon" ? <IconTicket size={14} /> : <IconPercentage size={14} />
                                }
                                color="gray"
                            >
                                {discountMode === "coupon" ? t("Coupon") : t("Discount")}
                            </Button>
                        </FormValidationWrapper>
                    </Grid.Col>
                    <Grid.Col span={6} bg={form.values.discount_type === "flat" ? "red.3" : form.values.discount_type === "percentage" ? "violet.3" : "gray.3"}>
                        {discountMode === "coupon" ? (
                            <TextInput
                                type="text"
                                placeholder={t("CouponCode")}
                                value={form.values.coupon_code}
                                error={form.errors.coupon_code}
                                size="sm"
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
                                opened={!!form.errors.discount}
                                position="left"
                            >
                                {form.values.discount_type === "flat" ? (
                                    <NumberInput
                                        placeholder={t("Discount")}
                                        value={form.values.discount}
                                        error={form.errors.discount}
                                        size="sm"
                                        onChange={(value) => form.setFieldValue("discount", value)}
                                        rightSection={
                                            <ActionIcon
                                                size={32}
                                                bg="red.5"
                                                variant="filled"
                                                mr={10}
                                                onClick={toggleDiscountMode}
                                            >
                                                <IconPercentage size={16} />
                                            </ActionIcon>

                                        }
                                    />
                                ) : (
                                    <NumberInput
                                        placeholder={t("Discount")}
                                        value={percentageValue}
                                        error={form.errors.discount}
                                        size="sm"
                                        suffix='%'
                                        max={100}
                                        min={0}
                                        allowNegative={false}
                                        step={1}
                                        decimalScale={2}
                                        hideControls
                                        onChange={handlePercentageChange}
                                        rightSection={
                                            <ActionIcon
                                                size={32}
                                                bg="violet.5"
                                                variant="filled"
                                                mr={10}
                                                onClick={toggleDiscountMode}
                                            >
                                                <IconNumber123 size={16} />
                                            </ActionIcon>
                                        }
                                    />
                                )}

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
                                placeholder={isSplitPaymentActive ? t("SplitPaymentActive") : t("Amount")}
                                value={form.values.receive_amount}
                                error={form.errors.receive_amount}
                                size="sm"
                                min={form.values.total}
                                readOnly={isSplitPaymentActive}
                                disabled={isSplitPaymentActive}
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