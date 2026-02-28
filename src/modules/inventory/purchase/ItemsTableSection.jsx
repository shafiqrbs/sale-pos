import React from "react";
import {
    ActionIcon,
    Box,
    Flex,
    NumberInput,
    Text,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { IconTrashX } from "@tabler/icons-react";
import tableCss from "@assets/css/Table.module.css";
import useConfigData from "@hooks/useConfigData";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

export default function ItemsTableSection({
    purchaseForm,
    itemsTotal,
}) {
    const { mainAreaHeight } = useMainAreaHeight();
    const tableHeight = mainAreaHeight - 394;
    const { configData } = useConfigData();
    const currencySymbol = configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;
    const purchaseItems = purchaseForm.values.items || [];

    const handleQuantityChange = (itemId, value) => {
        const numericValue =
            typeof value === "string" ? parseFloat(value) || 0 : value || 0;
        const updatedItems = purchaseItems.map((item) =>
            item.id === itemId ? { ...item, quantity: numericValue } : item
        );
        purchaseForm.setFieldValue("items", updatedItems);
    };

    const handlePriceChange = (itemId, value) => {
        const numericValue =
            typeof value === "string" ? parseFloat(value) || 0 : value || 0;
        const updatedItems = purchaseItems.map((item) =>
            item.id === itemId ? { ...item, price: numericValue } : item
        );
        purchaseForm.setFieldValue("items", updatedItems);
    };

    const handleRemoveItem = (itemId) => {
        const updatedItems = purchaseItems.filter((item) => item.id !== itemId);
        purchaseForm.setFieldValue("items", updatedItems);
    };

    return (
        <Box
            bd="1px solid #dee2e6"
            bg="white"
            p="3xs"
            className="borderRadiusAll"
        >
            <Box
                h={32}
                px="xs"
                fz="sm"
                fw={600}
                pt={6}
                mb={4}
                className="boxBackground textColor borderRadiusAll"
            >
                Purchase Items
            </Box>

            <DataTable
                classNames={{
                    root: tableCss.root,
                    table: tableCss.table,
                    header: tableCss.header,
                    footer: tableCss.footer,
                    pagination: tableCss.pagination,
                }}
                withColumnBorders={false}
                records={purchaseItems}
                columns={[
                    {
                        accessor: "serial",
                        title: "S/N",
                        width: 60,
                        render: (_, index) => index + 1,
                    },
                    {
                        accessor: "productName",
                        title: "Product",
                        render: (record) => (
                            <Text size="sm">{record.productName}</Text>
                        ),
                    },
                    {
                        accessor: "quantity",
                        title: "Qty",
                        textAlign: "center",
                        width: 120,
                        render: (record) => (
                            <NumberInput
                                size="xs"
                                value={record.quantity}
                                min={0}
                                step={1}
                                hideControls
                                onChange={(value) =>
                                    handleQuantityChange(record.id, value)
                                }
                            />
                        ),
                    },
                    {
                        accessor: "price",
                        title: "Price",
                        textAlign: "right",
                        width: 140,
                        render: (record) => (
                            <NumberInput
                                size="xs"
                                value={record.price}
                                min={0}
                                step={1}
                                hideControls
                                thousandSeparator=","
                                onChange={(value) =>
                                    handlePriceChange(record.id, value)
                                }
                            />
                        ),
                    },
                    {
                        accessor: "subTotal",
                        title: "Sub Total",
                        textAlign: "right",
                        width: 160,
                        render: (record) => {
                            const subTotal =
                                (record.quantity || 0) * (record.price || 0);
                            return (
                                <Text size="sm" fw={600}>
                                    {currencySymbol}
                                    {subTotal.toFixed(2)}
                                </Text>
                            );
                        },
                    },
                    {
                        accessor: "action",
                        title: "",
                        textAlign: "center",
                        width: 60,
                        render: (record) => (
                            <ActionIcon
                                size="sm"
                                variant="light"
                                color="var(--theme-delete-color)"
                                radius="sm"
                                onClick={() => handleRemoveItem(record.id)}
                            >
                                <IconTrashX size={16} />
                            </ActionIcon>
                        ),
                    },
                ]}
                height={tableHeight}
                scrollAreaProps={{ type: "never" }}
                noRecordsText="No items added"
            />

            <Box
                mt={4}
                px="xs"
                py={6}
                bg="var(--theme-primary-color-6)"
                className="borderRadiusAll"
            >
                <Flex justify="space-between" align="center">
                    <Text fz="sm" fw={600} c="white">
                        Σ&nbsp; {purchaseItems.length} Items
                    </Text>
                    <Flex align="center" gap={4}>
                        <Text fz="sm" fw={500} c="white">
                            {currencySymbol}
                        </Text>
                        <Text fz="sm" fw={700} c="white">
                            {itemsTotal.toFixed(2)}
                        </Text>
                    </Flex>
                </Flex>
            </Box>
        </Box>
    );
}

