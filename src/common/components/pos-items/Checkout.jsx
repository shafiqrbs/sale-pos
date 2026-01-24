import useGetInvoiceDetails from '@hooks/useGetInvoiceDetails';
import { Box, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router';
import CheckoutTable from './CheckoutTable';
import { useTranslation } from 'react-i18next';
import useConfigData from '@hooks/useConfigData';
import { IconSum } from '@tabler/icons-react';
import Transaction from './Transaction';

export default function Checkout({ tableId }) {
    const { t } = useTranslation();

    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const { invoiceData } = useGetInvoiceDetails(tableId, { offlineFetch: !isOnline })
    const [ returnOrDueText, setReturnOrDueText ] = useState(
        invoiceData?.sub_total > invoiceData?.payment ? "Return" : "Due"
    );
    const [ transactionModeData, setTransactionModeData ] = useState([]);

    const isSplitPaymentActive = !!invoiceData?.split_payment;
    const customerId = invoiceData?.customer_id;

    const form = useForm({
        initialValues: {
            customer_id: "",
            transaction_mode_id: "",
            sales_by_id: "",
            receive_amount: "",
            discount: "",
            coupon_code: "",
        },
        validate: {
            transaction_mode_id: (value) => {
                if (isSplitPaymentActive) return null;
                return !value || value === "" ? true : null;
            },
            sales_by_id: (value) => (!value ? true : null),
            customer_id: () => {
                return !customerId ? true : null;
            },
        },
    });

    useEffect(() => {
        async function fetchTransactionData() {
            const data = await window.dbAPI.getDataFromTable("accounting_transaction_mode");
            setTransactionModeData(data);
        }
        fetchTransactionData();
    }, []);

    return (
        <Box pr="3xs">
            <CheckoutTable invoiceData={invoiceData} />
            <Group
                h={34}
                justify="space-between"
                align="center"
                pt={0}
                bg={"gray.4"}
                style={{
                    borderTop: "2px solid var(--mantine-color-gray-4)",
                }}
            >
                <Text fw="bold" fz="sm" c="black" pl="2xs">
                    {t("SubTotal")}
                </Text>
                <Group gap="2xs" pr="sm" align="center">
                    <IconSum size="16" style={{ color: "black" }} />
                    <Text fw="bold" fz="sm" c="black">
                        {configData?.inventory_config?.currency?.symbol}{" "}
                        {(100.23).toFixed(2)}
                    </Text>
                </Group>
            </Group>
            <Transaction form={form} transactionModeData={transactionModeData} invoiceData={invoiceData} />
        </Box>
    )
}
