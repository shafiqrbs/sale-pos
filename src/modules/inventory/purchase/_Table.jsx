import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button } from '@mantine/core';
import { IconDotsVertical, IconEye, IconPlus } from '@tabler/icons-react';
import { useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router'
import { DataTable } from 'mantine-datatable';
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from 'react-i18next';
import Details from './__Details';
import KeywordSearch from '@components/KeywordSearch';
import GlobalModal from '@components/modals/GlobalModal';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { APP_NAVLINKS } from '@/routes/routes';
import { useGetPurchaseQuery } from '@services/purchase';

const PER_PAGE = 25;

export default function Table() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [ opened, { open, close } ] = useDisclosure(false);
    const [ page, setPage ] = useState(1);
    const [ selectedRow, setSelectedRow ] = useState(null);
    const [ loading, setLoading ] = useState(false);
    const [ viewData, setViewData ] = useState(null);
    const { mainAreaHeight } = useOutletContext();

    const form = useForm({
        initialValues: {
            term: "",
            start_date: "",
            end_date: "",
        },
    });

    const { data: purchaseData, isLoading } = useGetPurchaseQuery({
        params: {
            term: form.values.term,
            start_date: form.values.start_date,
            end_date: form.values.end_date,
            page,
            offset: PER_PAGE
        }
    });

    const handleShowDetails = (item) => {
        console.info("item:", item);
        setLoading(true);
        setSelectedRow(item.invoice);
        setViewData(item);
        open();

        setTimeout(() => {
            setLoading(false);
        }, 700)
    }

    return (
        <Box>
            <Flex mb="xs" gap="sm">
                <KeywordSearch showStartEndDate form={form} />
                <Button onClick={() => navigate(APP_NAVLINKS.PURCHASE_NEW)} w={150} bg="var(--theme-primary-color-6)" color="white" leftSection={<IconPlus size={18} />}>
                    {t("Purchase")}
                </Button>
            </Flex>
            <Grid columns={24} gutter={{ base: 8 }}>
                <Grid.Col span={24}>
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
                            records={purchaseData?.data}
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
                                    accessor: "customerName", title: t("Vendor"), render: (item) => (
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
                            totalRecords={purchaseData?.total || 0}
                            recordsPerPage={PER_PAGE}
                            loaderSize="xs"
                            loaderColor="grape"
                            page={page}
                            onPageChange={(p) => {
                                setPage(p);
                            }}
                            height={mainAreaHeight - 54}
                            scrollAreaProps={{ type: "never" }}
                            rowStyle={(item) =>
                                item.invoice === selectedRow
                                    ? { background: "var(--theme-primary-color-0)", color: "#FA5463" }
                                    : undefined
                            }
                        />
                    </Box>
                </Grid.Col>
            </Grid>

            <GlobalModal
                opened={opened}
                onClose={close}
                size="xl"
                padding="md"
                title={`${t("Purchase")}: ${viewData?.invoice || ""}`}
            >
                <Details loading={loading} viewData={viewData} />
            </GlobalModal>
        </Box>
    );
}
