import React, { useState } from 'react'
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from 'react-i18next';
import useConfigData from '@hooks/useConfigData';
import { useOutletContext } from 'react-router';
import { Button } from '@mantine/core';
import { DataTable } from 'mantine-datatable';
import { IconPlus } from '@tabler/icons-react';
import useCartOperation from '@hooks/useCartOperation';
import BatchProductModal from '@components/modals/BatchProductModal';
import { useDisclosure } from '@mantine/hooks';

export default function ProductTable({ products }) {
    const { t } = useTranslation()
    const { mainAreaHeight, isOnline } = useOutletContext()
    const { configData } = useConfigData({ offlineFetch: !isOnline })
    const { increment } = useCartOperation();
    const [ selectedProduct, setSelectedProduct ] = useState(null);
    const [ batchModalOpened, { open: openBatchModal, close: closeBatchModal } ] = useDisclosure(false);

    // =============== handle add button click ================
    const handleAddClick = async (product) => {
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
            // =============== fetch current batches from cart ================
            const itemCondition = {
                stock_item_id: product.stock_item_id || product.stock_id,
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
        } else {
            // =============== directly add to cart ================
            increment(product);
        }
    };

    // =============== handle batch selection ================
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
                records={products}
                columns={[
                    {
                        accessor: "id",
                        title: "S/N",
                        render: (_, index) => index + 1,
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
                                {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol}{" "}
                                {data.sales_price}
                            </>
                        ),
                    },
                    {
                        accessor: "qty",
                        title: "",
                        textAlign: "center",
                        render: (data) => (
                            <Button
                                leftSection={<IconPlus height={14} width={14} stroke={2} />}
                                size='compact-xs'
                                bg="gray.7"
                                onClick={() => handleAddClick(data)}
                            >
                                Add
                            </Button>
                        ),
                    },
                ]}
                loaderSize="xs"
                loaderColor="grape"
                height={mainAreaHeight - 58}
                scrollAreaProps={{ type: "never" }}
            />

            {/* =============== batch selection modal ================ */}
            <BatchProductModal
                opened={batchModalOpened}
                close={closeBatchModal}
                purchaseItems={JSON.parse(selectedProduct?.purchase_item_for_sales || "[]")}
                currentBatches={selectedProduct?.currentBatches || []}
                onBatchSelect={handleBatchSelect}
            />
        </>
    )
}
