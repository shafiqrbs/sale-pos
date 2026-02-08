// import useGetInvoiceDetails from '@hooks/useGetInvoiceDetails';
import { Box, Group, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import React, { useEffect } from 'react'
import { useOutletContext } from 'react-router';
import CheckoutTable from './CheckoutTable';
import { useTranslation } from 'react-i18next';
import useConfigData from '@hooks/useConfigData';
import { IconSum } from '@tabler/icons-react';
import Transaction from './Transaction';
import useCartOperation from '@hooks/useCartOperation';
import useLoggedInUser from '@hooks/useLoggedInUser';

export default function Checkout() {
    const { t } = useTranslation();

    const user = useLoggedInUser();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const { invoiceData, getCartTotal } = useCartOperation()

    const isSplitPaymentActive = !!invoiceData?.split_payment;
    const customerId = invoiceData?.customer_id;

    const form = useForm({
        initialValues: {
            customer_id: "",
            transaction_mode_id: "",
            transaction_mode_name: "",
            sales_by_id: "",
            receive_amount: null,
            discount_type: "flat",
            discount: 0,
            coupon_code: "",
            split_payments: [],
            multi_transaction: 0,
            split_payment_drawer_opened: false,
        },
        validate: {
            transaction_mode_id: (value) => {
                if (isSplitPaymentActive) return null;
                return !value || value === "" ? true : null;
            },
            receive_amount: (value) => {
                return !value || value === "" ? true : null;
            },
            sales_by_id: (value) => (!value ? true : null),
            customer_id: () => {
                return !customerId ? true : null;
            },
        },
    });

    useEffect(() => {
        if (user) {
            form.setFieldValue("sales_by_id", user?.id?.toString());
        }
    }, [ user ]);

    return (
        <Box pr="3xs">
            <CheckoutTable />

            <Group
                h={34}
                justify="space-between"
                align="center"
                pt={0}
                bg="gray.4"
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
                        {getCartTotal()?.toFixed(2)}
                    </Text>
                </Group>
            </Group>

            <Transaction form={form} />
        </Box>
    )
}
