import { Box, Grid, Text, ActionIcon, Group, Menu, Flex } from '@mantine/core';
import { IconDotsVertical, IconEye } from '@tabler/icons-react';
import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import { DataTable } from 'mantine-datatable';
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from 'react-i18next';
import SalesDetails from './__SalesDetails';
import useSalesList from '@hooks/useSalesList';

const PER_PAGE = 25;

export default function Table({ activeTab }) {
    const { t } = useTranslation();
    const [ showDetails, setShowDetails ] = useState(false);
    const [ page, setPage ] = useState(1);
    const [ selectedRow, setSelectedRow ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ salesViewData, setSalesViewData ] = useState(null);
    const { mainAreaHeight, isOnline } = useOutletContext();
    const { sales: salesData, isLoading } = useSalesList({
        params: {
            term: "",
            customer_id: "",
            start_date: "",
            end_date: "",
            page,
            offset: PER_PAGE
        },
        offlineFetch: !isOnline,
        activeTab,
    });

    useEffect(() => {
        // disableeslint-disable-next-line react-hooks/exhaustive-deps
        setShowDetails(prev => (prev ? false : prev));
    }, [ isOnline ]);

    const handleShowDetails = (item) => {
        console.info("item:", item);
        setLoading(true);
        setSelectedRow(item.invoice);
        setSalesViewData(item);
        setShowDetails(true);

        setTimeout(() => {
            setLoading(false);
        }, 700)
    }

    return (
        <Grid columns={24} gutter={{ base: 8 }}>
            <Grid.Col span={showDetails ? 15 : 24}>
                <Box bg="white" className="borderRadiusAll" bd="1px solid #e6e6e6">
                    <DataTable
                        classNames={{
                            root: tableCss.root,
                            table: tableCss.table,
                            header: tableCss.header,
                            footer: tableCss.footer,
                            pagination: tableCss.pagination,
                        }}
                        onRowClick={(rowData) => {
                            handleShowDetails(rowData.record);
                        }}
                        records={salesData?.data}
                        columns={[
                            {
                                accessor: "created",
                                title: t("Created"),
                                render: (item) => (
                                    <Text component="a" size="sm" variant="subtle" c="var(--theme-primary-color-6)">
                                        {item?.created}
                                    </Text>
                                ),
                            },
                            {
                                accessor: "invoice",
                                title: t("Invoice"),
                                render: (item) => (
                                    <Text
                                        component="a"
                                        size="sm"
                                        variant="subtle"
                                        c="var(--theme-primary-color-6)"
                                    >
                                        {item.invoice}
                                    </Text>
                                ),
                            },
                            {
                                accessor: "customerName", title: t("Customer"), render: (item) => (
                                    <Text size="sm">
                                        {item?.customerName || "N/A"}
                                    </Text>
                                )
                            },
                            {
                                accessor: "subtotal",
                                title: t("Sub Total"),
                                textAlign: "right",
                                render: (data) => (
                                    <>{data.sub_total}</>
                                ),
                            },
                            {
                                accessor: "discount",
                                title: t("Discount"),
                                textAlign: "right",
                                render: (data) => (
                                    <>{data.discount ? Number(data.discount).toFixed(2) : "0.00"}</>
                                ),
                            },
                            {
                                accessor: "total",
                                title: t("Total"),
                                textAlign: "right",
                                render: (data) => (
                                    <>{data.total ? Number(data.total).toFixed(2) : "0.00"}</>
                                ),
                            },
                            {
                                accessor: "payment",
                                title: t("Receive"),
                                textAlign: "right",
                                render: (data) => (
                                    <>{data.payment ? Number(data.payment).toFixed(2) : "0.00"}</>
                                ),
                            },
                            {
                                accessor: "due",
                                title: t("Due"),
                                textAlign: "right",
                                render: (data) => {
                                    return <>{Number(data.total) - Number(data.payment)}</>;
                                },
                            },
                            {
                                accessor: "action",
                                title: t("Action"),
                                textAlign: "right",
                                render: (data) => (
                                    <Group gap={4} justify="right" wrap="nowrap">
                                        <Menu
                                            position="bottom-end"
                                            offset={3}
                                            withArrow
                                            trigger="hover"
                                            openDelay={100}
                                            closeDelay={400}
                                        >
                                            <Menu.Target>
                                                <ActionIcon
                                                    size="sm"
                                                    variant="outline"
                                                    color="var(--theme-primary-color-6)"
                                                    radius="xl"
                                                    aria-label="Settings"
                                                    onClick={(e) => e.preventDefault()}
                                                >
                                                    <IconDotsVertical
                                                        height="18"
                                                        width="18"
                                                        stroke={1.5}
                                                    />
                                                </ActionIcon>
                                            </Menu.Target>
                                            <Menu.Dropdown>
                                                <Menu.Item
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleShowDetails(data);
                                                    }}
                                                    w="140"
                                                >
                                                    <Flex gap={4} align="center">
                                                        <IconEye size={18} />
                                                        <Text size="sm">{t("Show")}</Text>
                                                    </Flex>
                                                </Menu.Item>
                                            </Menu.Dropdown>
                                        </Menu>
                                    </Group>
                                ),
                            },
                        ]}
                        fetching={isLoading}
                        totalRecords={salesData?.total || 0}
                        recordsPerPage={PER_PAGE}
                        loaderSize="xs"
                        loaderColor="grape"
                        page={page}
                        onPageChange={(p) => {
                            setPage(p);
                        }}
                        height={mainAreaHeight}
                        scrollAreaProps={{ type: "never" }}
                        rowStyle={(item) =>
                            item.invoice === selectedRow
                                ? { background: "#e2c2c263", color: "#FA5463" }
                                : undefined
                        }
                    />
                </Box>
            </Grid.Col>

            {showDetails && (
                <Grid.Col span={9}>
                    <SalesDetails loading={loading} salesViewData={salesViewData} salesData={salesData} />
                </Grid.Col>
            )}
        </Grid>

    )
}
