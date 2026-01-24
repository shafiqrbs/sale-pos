import React from 'react'
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from 'react-i18next';
import useConfigData from '@hooks/useConfigData';
import { useOutletContext } from 'react-router';
import { Button } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { IconPlus } from '@tabler/icons-react';

export default function ProductTable({ products }) {
    const { t } = useTranslation()
    const { mainAreaHeight, isOnline } = useOutletContext()
    const { configData } = useConfigData({ offlineFetch: !isOnline })

    return (
        <DataTable
            classNames={{
                root: tableCss.root,
                table: tableCss.table,
                header: tableCss.header,
                footer: tableCss.footer,
                pagination: tableCss.pagination,
            }}
            records={products}
            columns={[
                {
                    accessor: "id",
                    title: "S/N",
                    render: (data, index) => index + 1,
                },
                {
                    accessor: "display_name",
                    title: t("Product"),
                },
                {
                    accessor: "price",
                    title: t("Price"),
                    textAlign: "center",
                    render: (data) => (
                        <>
                            {configData?.currency?.symbol}{" "}
                            {data.sales_price}
                        </>
                    ),
                },
                {
                    accessor: "qty",
                    title: "",
                    textAlign: "center",
                    render: () => (
                        <Button leftSection={<IconPlus height={14} width={14} stroke={2} />} size='compact-xs' bg="var(--theme-primary-color-6)">Add</Button>
                    ),
                },
            ]}
            loaderSize="xs"
            loaderColor="grape"
            height={mainAreaHeight - 58}
            scrollAreaProps={{ type: "never" }}
        />
    )
}
