import { useState } from 'react'
import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button, Badge } from '@mantine/core';
import { IconCopy, IconDotsVertical, IconEye, IconPlus, IconTrashX } from '@tabler/icons-react';
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
import { useApprovePurchaseMutation, useCopyPurchaseMutation, useGetPurchaseQuery, useDeletePurchaseMutation } from '@services/purchase';
import { modals } from '@mantine/modals';
import { showNotification } from '@components/ShowNotificationComponent';

const PER_PAGE = 25;

export default function Table() {
    const [ approvePurchase ] = useApprovePurchaseMutation();
    const [ copyPurchase ] = useCopyPurchaseMutation();
    const [ deletePurchase ] = useDeletePurchaseMutation();
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

    const handlePurchaseApprove = (id) => {
        // Open confirmation modal
        modals.openConfirmModal({
            title: <Text size="md">{t("FormConfirmationTitle")}</Text>,
            children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
            labels: { confirm: t("Submit"), cancel: t("Cancel") },
            confirmProps: { color: "red" },
            onCancel: () => {
                console.log("Cancel");
            },
            onConfirm: () => {
                handleConfirmPurchaseApprove(id)
            }
        });
    };

    const handleConfirmPurchaseApprove = async (id) => {
        try {
            const res = await approvePurchase(id);

            if (res.data.status === 200) {
                showNotification(t("ApprovedSuccessfully"), "teal")
            }
        } catch (error) {
            console.error("Error approving purchase:", error);
            showNotification(error?.data?.message || t("ApproveFailed"), "red")
        }
    };

    const handlePurchaseCopy = async (id) => {
        try {
            const res = await copyPurchase(id);
            if (res.data.status === 200) {
                showNotification(t("CopyPurchaseSuccessfully"), "teal")
            }
        } catch (error) {
            console.error("Error copying purchase:", error);
            showNotification(error?.data?.message || t("CopyPurchaseFailed"), "red")
        }
    };

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

    // =============== open copy purchase confirmation modal ===============
    const handleOpenCopyConfirmModal = (purchaseId) => {
        modals.openConfirmModal({
            title: <Text size="md"> {t("CopyPurchase")}</Text>,
            children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
            labels: { confirm: 'Confirm', cancel: 'Cancel' },
            onCancel: () => console.log('Cancel'),
            onConfirm: () => handlePurchaseCopy(purchaseId),
        });
    };

    // =============== open purchase details view from menu (stops propagation so row click does not fire) ===============
    const handleShowPurchaseFromMenu = (event, purchaseData) => {
        event.stopPropagation();
        handleShowDetails(purchaseData);
    };

    // =============== open delete purchase confirmation modal ===============
    const handleOpenDeleteConfirmModal = (purchaseId) => {
        modals.openConfirmModal({
            title: <Text size="md"> {t("FormConfirmationTitle")}</Text>,
            children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
            labels: { confirm: "Confirm", cancel: "Cancel" },
            confirmProps: { color: "red.6" },
            onCancel: () => console.log("Cancel"),
            onConfirm: () => deletePurchase(purchaseId),
        });
    };

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
                                    accessor: "vendor_name", title: t("Vendor"), render: (item) => (
                                        <Text size="sm">
                                            {item?.vendor_name || "N/A"}
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
                                    title: t("Payable"),
                                    textAlign: "right",
                                    render: (data) => {
                                        return <>{Number(data.total) - Number(data.payment)}</>;
                                    },
                                },
                                // { accessor: "payment", title: t("Payment") },
                                { accessor: "mode", title: t("Mode") },
                                {
                                    accessor: "process",
                                    title: t("Status"),
                                    width: "130px",
                                    render: (item) => {
                                        const colorMap = {
                                            Created: "blue",
                                            Approved: "red",
                                        };

                                        const badgeColor = colorMap[ item.process ] || "gray";

                                        return item.process && <Badge color={badgeColor}>{item.process}</Badge>;
                                    }
                                },
                                {
                                    accessor: "action",
                                    title: t("Action"),
                                    textAlign: "right",
                                    render: (data) => (
                                        <Group gap={4} justify="right" wrap="nowrap">
                                            {
                                                !data.approved_by_id &&
                                                <Button component="a" size="compact-xs" radius="xs"
                                                    variant="filled" fw={'100'} fz={'12'}
                                                    color='var(--theme-secondary-color-8)'
                                                    mr={'4'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePurchaseApprove(data.id)
                                                    }}
                                                >{t('Approve')}
                                                </Button>
                                            }
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
                                                        variant="transparent"
                                                        color='red'
                                                        radius="xl"
                                                        aria-label="Settings"
                                                    >
                                                        <IconDotsVertical
                                                            height={"18"}
                                                            width={"18"}
                                                            stroke={1.5}
                                                        />
                                                    </ActionIcon>
                                                </Menu.Target>
                                                <Menu.Dropdown>

                                                    {
                                                        <Menu.Item
                                                            onClick={() => handleOpenCopyConfirmModal(data.id)}
                                                            leftSection={
                                                                <IconCopy
                                                                    height={"18"}
                                                                    width={"18"}
                                                                    stroke={1.5}
                                                                />
                                                            }
                                                            w="200"
                                                        >
                                                            {t("Copy")}
                                                        </Menu.Item>
                                                    }
                                                    <Menu.Item
                                                        onClick={(event) => handleShowPurchaseFromMenu(event, data)}
                                                        w="200"
                                                        leftSection={
                                                            <IconEye
                                                                height={"18"}
                                                                width={"18"}
                                                                stroke={1.5}
                                                            />
                                                        }
                                                    >
                                                        {t("Show")}
                                                    </Menu.Item>

                                                    {
                                                        !data.approved_by_id && data.is_requisition !== 1 &&
                                                        <Menu.Item
                                                            onClick={() => handleOpenDeleteConfirmModal(data.id)}
                                                            w={200}
                                                            leftSection={
                                                                <IconTrashX
                                                                    height={"18"}
                                                                    width={"18"}
                                                                    stroke={1.5}
                                                                />
                                                            }
                                                        >
                                                            {t("Delete")}
                                                        </Menu.Item>
                                                    }

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
