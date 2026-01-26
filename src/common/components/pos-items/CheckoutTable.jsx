import React from 'react'
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { Text, Tooltip, Group, ActionIcon } from "@mantine/core";
import { IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import useCartOperation from '@hooks/useCartOperation';

export default function CheckoutTable() {
    const { mainAreaHeight } = useOutletContext()
    const { t } = useTranslation();
    const { invoiceData, increment, decrement, remove } = useCartOperation()

    const handleClick = () => {
        console.log("handleClick")
    }

    console.log("invoiceData: ", invoiceData)

    return (
        <DataTable
            classNames={{
                root: tableCss.root,
                table: tableCss.table,
                header: tableCss.header,
                footer: tableCss.footer,
                pagination: tableCss.pagination,
            }}
            records={invoiceData || []}
            columns={[
                {
                    accessor: "id",
                    title: "S/N",
                    width: 48,
                    render: (data, index) => index + 1,
                },
                {
                    accessor: "display_name",
                    title: t("Product"),
                    render: (data) => (
                        <Tooltip
                            multiline
                            w={220}
                            px={12}
                            py={2}
                            bg={"red.6"}
                            c={"white"}
                            withArrow
                            position="top"
                            offset={{ mainAxis: 5, crossAxis: 10 }}
                            zIndex={999}
                            transitionProps={{
                                transition: "pop-bottom-left",
                                duration: 500,
                            }}
                        >
                            <Text
                                variant="subtle"
                                style={{ cursor: "pointer" }}
                                component="a"
                                onClick={handleClick}
                                name="additionalProductAdd"
                                c={"red"}
                                fz={"xs"}
                            >
                                {data.display_name}
                            </Text>
                        </Tooltip>
                    ),
                },
                {
                    accessor: "quantity",
                    title: t("Qty"),
                    textAlign: "center",
                    render: (data) => (
                        <Group miw={100} gap={4} justify="center">
                            <ActionIcon
                                size={"sm"}
                                bg={"gray.7"}
                                disabled={data.quantity === 1}
                                onClick={() => decrement(data)}
                            >
                                <IconMinus height={"12"} width={"12"} />
                            </ActionIcon>
                            <Text size="sm" ta={"center"} fw={600} maw={30} miw={30}>
                                {data.quantity}
                            </Text>
                            <ActionIcon
                                size={"sm"}
                                bg={"gray.7"}
                                onClick={() => increment(data)}
                            >
                                <IconPlus height={"12"} width={"12"} />
                            </ActionIcon>
                        </Group>
                    ),
                },
                {
                    accessor: "price",
                    title: t("Price"),
                    textAlign: "right",
                    render: (data) => <>{data.sales_price}</>,
                },
                {
                    accessor: "subtotal",
                    title: "Subtotal",
                    textAlign: "right",
                    render: (data) => <>{data.sub_total.toFixed(2)}</>,
                },
                {
                    accessor: "action",
                    title: t(""),
                    textAlign: "right",
                    render: (data) => (
                        <ActionIcon
                            size="sm"
                            variant="white"
                            color="red.8"
                            aria-label="delete"
                            onClick={() => {
                                remove(data);
                            }}
                        >
                            <IconTrash height={20} width={20} stroke={1.5} />
                        </ActionIcon>
                    ),
                },
            ]}
            loaderSize="xs"
            loaderColor="grape"
            height={
                mainAreaHeight - 349
            }
            scrollAreaProps={{ type: "never" }}
        />
    )
}
