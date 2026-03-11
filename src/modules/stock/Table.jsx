import { useState, useCallback, useEffect } from "react";
import { Box, Flex, ActionIcon } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconReload } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import useLocalProducts from "@hooks/useLocalProducts.js";
import useConfigData from "@hooks/useConfigData.js";
import { formatCurrency } from "@utils/index.js";

const PER_PAGE = 25;

export default function Table() {
    const { t } = useTranslation();
    const { mainAreaHeight } = useMainAreaHeight();
    const { configData } = useConfigData({ offlineFetch: true });
    const [ page, setPage ] = useState(1);

    const {
        products,
        totalCount,
        getLocalProducts,
        getProductCount,
        loading,
    } = useLocalProducts({ fetchOnMount: false });

    const currencySymbol =
        configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol || "";

    // =============== fetch products with pagination ================
    const fetchProductsPage = useCallback(async () => {
        const offset = (page - 1) * PER_PAGE;

        await getLocalProducts({}, "id", {
            limit: PER_PAGE,
            offset,
            orderBy: "id ASC",
        });

        await getProductCount({}, {});
    }, [ page, getLocalProducts, getProductCount ]);

    // =============== fetch on mount and when page changes ================
    useEffect(() => {
        fetchProductsPage();
    }, [ fetchProductsPage ]);

    // =============== listen for product updates from sales and refetch ================
    useEffect(() => {
        window.addEventListener("products-updated", fetchProductsPage);

        return () => {
            window.removeEventListener("products-updated", fetchProductsPage);
        };
    }, [ fetchProductsPage ]);

    const height = mainAreaHeight - 60;

    return (
        <Box p="sm" className="border-all-radius border-top-none overflow-hidden">
            <Flex gap="sm" mb="2xs" justify="flex-end" align="center">
                <ActionIcon
                    bg="var(--theme-secondary-color-6)"
                    onClick={fetchProductsPage}
                    disabled={loading}
                    aria-label="Refresh"
                >
                    <IconReload size={16} stroke={1.5} />
                </ActionIcon>
            </Flex>
            <Box className="border-all-radius border-top-none overflow-hidden">
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
                            accessor: "index",
                            title: t("S/N"),
                            textAlignment: "right",
                            width: 70,
                            render: (record) => products.indexOf(record) + 1 + (page - 1) * PER_PAGE,
                        },
                        {
                            accessor: "stock_id",
                            title: t("StockN") + " ID",
                            width: 100,
                            render: (record) => record.stock_id ?? record.stock_item_id ?? record.id ?? "—",
                        },
                        {
                            accessor: "display_name",
                            title: t("Product"),
                            width: 220,
                            render: (record) => record.display_name || "—",
                        },
                        {
                            accessor: "barcode",
                            title: t("Barcode"),
                            width: 130,
                            render: (record) => record.barcode || "—",
                        },
                        {
                            accessor: "category_id",
                            title: t("CategoryId"),
                            width: 140,
                            render: (record) => record.category_id || "—",
                        },
                        {
                            accessor: "unit_name",
                            title: t("Unit"),
                            width: 90,
                            render: (record) => record.unit_name || "—",
                        },
                        {
                            accessor: "quantity",
                            title: t("Quantity"),
                            textAlignment: "right",
                            width: 100,
                            render: (record) => {
                                const quantity = record.quantity;
                                return quantity != null && quantity !== "" ? Number(quantity) : "—";
                            },
                        },
                        {
                            accessor: "purchase_price",
                            title: t("Purchase") + " " + t("Price"),
                            textAlignment: "right",
                            width: 120,
                            render: (record) =>
                                record.purchase_price != null
                                    ? `${currencySymbol} ${formatCurrency(record.purchase_price)}`
                                    : "—",
                        },
                        {
                            accessor: "sales_price",
                            title: t("Sales") + " " + t("Price"),
                            textAlignment: "right",
                            width: 120,
                            render: (record) =>
                                record.sales_price != null
                                    ? `${currencySymbol} ${formatCurrency(record.sales_price)}`
                                    : "—",
                        },
                    ]}
                    fetching={loading}
                    totalRecords={totalCount}
                    recordsPerPage={PER_PAGE}
                    page={page}
                    onPageChange={setPage}
                    loaderSize="xs"
                    loaderColor="grape"
                    height={height}
                    scrollAreaProps={{ type: "never" }}
                />
            </Box>
        </Box>
    );
}
