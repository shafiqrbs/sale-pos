import React, { useState } from 'react'
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { Text, Group, ActionIcon, NumberInput } from "@mantine/core";
import { IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router';
import useCartOperation from '@hooks/useCartOperation';
import BatchProductModal from '@components/modals/BatchProductModal';
import { useDisclosure } from '@mantine/hooks';

export default function CheckoutTable() {
    const { mainAreaHeight } = useOutletContext()
    const { t } = useTranslation();
    const { invoiceData, increment, decrement, remove, updateQuantity } = useCartOperation()
    const [ selectedProduct, setSelectedProduct ] = useState(null);
    const [ batchModalOpened, { open: openBatchModal, close: closeBatchModal } ] = useDisclosure(false);

    const handleClick = () => {
        console.info("handleClick")
    }

    // =============== check if product has batches and open modal ================
    const checkAndOpenBatchModal = async (data) => {
        const fullProduct = await window.dbAPI.getDataFromTable("core_products", {
            stock_id: data.stock_item_id
        });

        if (fullProduct && fullProduct.length > 0) {
            const product = fullProduct[ 0 ];
            let purchaseItems = [];

            // =============== parse purchase_item_for_sales ================
            try {
                purchaseItems = product.purchase_item_for_sales
                    ? JSON.parse(product.purchase_item_for_sales)
                    : [];
            } catch (error) {
                console.error('Error parsing purchase_item_for_sales:', error);
                purchaseItems = [];
            }

            // =============== if product has batches, show modal ================
            if (purchaseItems.length > 0) {
                const itemCondition = {
                    stock_item_id: data.stock_item_id,
                };
                const cartItems = await window.dbAPI.getDataFromTable("invoice_table_item", itemCondition);

                let currentBatches = [];
                if (cartItems && cartItems.length > 0) {
                    try {
                        currentBatches = typeof cartItems[ 0 ].batches === 'string'
                            ? JSON.parse(cartItems[ 0 ].batches)
                            : (Array.isArray(cartItems[ 0 ].batches) ? cartItems[ 0 ].batches : []);
                    } catch {
                        currentBatches = [];
                    }
                }

                setSelectedProduct({ ...product, currentBatches });
                openBatchModal();
                return true;
            }
        }
        return false;
    };

    // =============== handle increment or decrement with batch check ================
    const handleQuantityChange = async (data, action = 'increment') => {
        const hasBatch = await checkAndOpenBatchModal(data);

        if (!hasBatch) {
            // =============== for non-batched products, use regular increment/decrement ================
            if (action === 'increment') {
                increment(data);
            } else {
                decrement(data);
            }
        }
    };

    // =============== handle quantity input click ================
    const handleQuantityInputClick = async (event, data) => {
        event.preventDefault();
        const hasBatch = await checkAndOpenBatchModal(data);

        if (hasBatch) {
            event.target.blur();
        }
    };

    const handleBatchSelect = (selectedBatches) => {
        if (selectedProduct) {
            const isUpdate = selectedProduct.currentBatches && selectedProduct.currentBatches.length > 0;
            increment(selectedProduct, selectedBatches, isUpdate);
            setSelectedProduct(null);
        }
    };

    return (
        <>
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
                            <Text
                                variant="subtle"
                                onClick={handleClick}
                                c={"red"}
                                fz={"xs"}
                            >
                                {data.display_name}
                            </Text>
                        ),
                    },
                    {
                        accessor: "quantity",
                        title: t("Qty"),
                        textAlign: "center",
                        render: (data) => (
                            <Group wrap='nowrap' miw={50} gap={4} justify="center">
                                <ActionIcon
                                    size="sm"
                                    bg={"gray.7"}
                                    disabled={data.quantity === 1}
                                    onClick={() => handleQuantityChange(data, 'decrement')}
                                >
                                    <IconMinus height="12" width="12" />
                                </ActionIcon>
                                <NumberInput
                                    size="xs"
                                    ta="center"
                                    fw={600}
                                    maw={80}
                                    value={data.quantity}
                                    min={0}
                                    step={1}
                                    decimalScale={3}
                                    hideControls
                                    allowNegative={false}
                                    onClick={(event) => handleQuantityInputClick(event, data)}
                                    onChange={(value) => {
                                        updateQuantity(data, value);
                                    }}
                                    styles={{
                                        input: {
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            padding: '0 2px'
                                        }
                                    }}
                                />
                                <ActionIcon
                                    size="sm"
                                    bg={"gray.7"}
                                    onClick={() => handleQuantityChange(data, 'increment')}
                                >
                                    <IconPlus height="12" width="12" />
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

            <BatchProductModal
                opened={batchModalOpened}
                close={closeBatchModal}
                purchaseItems={JSON.parse(selectedProduct?.purchase_item_for_sales || "[]")}
                currentBatches={selectedProduct?.currentBatches || []}
                productName={selectedProduct?.display_name}
                onBatchSelect={handleBatchSelect}
            />
        </>
    )
}
