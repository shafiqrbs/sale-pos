import React, { useMemo } from 'react'
import { Box, Grid } from '@mantine/core'
import { useOutletContext } from 'react-router'
import useGetInvoiceType from '@hooks/useGetInvoiceType'
import Tables from '@modules/pos/common/Tables'
import ProductList from '@modules/pos/common/ProductList'
import Checkout from '@modules/pos/common/Checkout'

const getParticularName = (mode, item) => {
    switch (mode) {
        case "table":
            return item.particular_name ?? "Unnamed Table";
        case "user":
            return item.username ?? "Unknown User";
        case "customer":
            return item.customer_name ?? "Unknown Customer";
        default:
            return "Unknown";
    }
};

export default function BakeryIndex() {
    const { isOnline } = useOutletContext()
    const { invoiceType } = useGetInvoiceType({ offlineFetch: !isOnline })

    const invoiceMode = invoiceType?.[ 0 ]?.invoice_mode || "table"

    const transformedTables = useMemo(() => {
        if (!Array.isArray(invoiceType)) return [];

        return invoiceType.map((item) => ({
            id: item.id,
            status: item.is_active,
            statusHistory: [],
            currentStatusStartTime: null,
            elapsedTime: "00:00:00",
            value: getParticularName(invoiceMode, item),
            customer_id: item.customer_id ?? null,
            table_id: item.table_id ?? null,
            user_id: item.user_id ?? null,
        }));
    }, [ invoiceType, invoiceMode ]);

    return (
        <Box>
            {/* configData?.inventory_config?.is_pos && invoiceMode === "table" */}
            <Tables />
            <Grid columns={12} gutter="4xs">
                <Grid.Col span={8}>
                    <ProductList />
                </Grid.Col>
                <Grid.Col span={4}>
                    <Checkout />
                </Grid.Col>
            </Grid>
        </Box>
    )
}
