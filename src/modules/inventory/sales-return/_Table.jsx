import { useState } from "react";
import {
	Box,
	Grid,
	Text,
	ActionIcon,
	Group,
	Menu,
	Flex,
	Button,
	Badge,
	SegmentedControl,
	Tooltip,
} from "@mantine/core";
import {
	IconDotsVertical,
	IconEdit,
	IconEye,
	IconPlus,
	IconRefresh,
	IconTrashX,
} from "@tabler/icons-react";
import { useNavigate, useOutletContext } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import Details from "./__Details";
import KeywordSearch from "@components/KeywordSearch";
import GlobalModal from "@components/modals/GlobalModal";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { APP_NAVLINKS } from "@/routes/routes";
import { modals } from "@mantine/modals";
import { showNotification } from "@components/ShowNotificationComponent";
import { formatCurrency } from "@utils/index";
import {
	useApprovePurchaseReturnMutation,
	usePurchaseReturnSendToVendorMutation,
	useGetPurchaseReturnQuery,
} from "@services/purchase-return";
import PageBreadcrumb from "@components/layout/PageBreadcrumb";

const PER_PAGE = 25;

export default function Table() {
	const [ approvePurchaseReturn ] = useApprovePurchaseReturnMutation();
	const [ useSendToVendorMutation ] = usePurchaseReturnSendToVendorMutation();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [ opened, { open, close } ] = useDisclosure(false);
	const [ page, setPage ] = useState(1);
	const [ selectedRow, setSelectedRow ] = useState(null);
	const [ loading, setLoading ] = useState(false);
	const [ viewData, setViewData ] = useState(null);
	const [ deletedPurchaseIds, setDeletedPurchaseIds ] = useState(new Set());
	const [ userChoice, setUserChoice ] = useState(null);
	const { mainAreaHeight, isOnline } = useOutletContext();
	// =============== when offline, always use offline data (online segment disabled) ===============
	const effectiveDataSource = isOnline ? (userChoice ?? "online") : "offline";

	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const {
		data: entities,
		isLoading,
		refetch,
	} = useGetPurchaseReturnQuery({
		params: {
			term: form.values.term,
			start_date: form.values.start_date,
			end_date: form.values.end_date,
			page,
			offset: PER_PAGE,
		},
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
				handleConfirmPurchaseApprove(id);
			},
		});
	};

	const handleConfirmPurchaseApprove = async (id) => {
		try {
			const res = await approvePurchaseReturn(id);

			if (res.data.status === 200) {
				showNotification(t("ApprovedSuccessfully"), "teal");
			}
		} catch (error) {
			console.error("Error approving purchase:", error);
			showNotification(error?.data?.message || t("ApproveFailed"), "red");
		}
	};

	const handleSendVendorApproveConfirm = (id) => {
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
				handleSendVendorApprove(id);
			},
		});
	};

	const handleSendVendorApprove = async (id) => {
		try {
			const res = await useSendToVendorMutation(id);
			if (res.data.status === 200) {
				showNotification(t("ApprovedSuccessfully"), "teal");
			}
		} catch (error) {
			console.error("Error approving purchase:", error);
			showNotification(error?.data?.message || t("ApproveFailed"), "red");
		}
	};

	const handlePurchaseCopy = async (id) => {
		try {
			const res = await copyPurchase(id);
			if (res.data.status === 200) {
				showNotification(t("CopyPurchaseSuccessfully"), "teal");
			}
		} catch (error) {
			console.error("Error copying purchase:", error);
			showNotification(error?.data?.message || t("CopyPurchaseFailed"), "red");
		}
	};

	const handleShowDetails = (item) => {
		setLoading(true);
		setSelectedRow(item.invoice);
		setViewData(item);
		open();

		setTimeout(() => {
			setLoading(false);
		}, 700);
	};

	// =============== open copy purchase confirmation modal ===============
	const handleOpenCopyConfirmModal = (purchaseId) => {
		modals.openConfirmModal({
			title: <Text size="md"> {t("CopyPurchase")}</Text>,
			children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
			labels: { confirm: "Confirm", cancel: "Cancel" },
			onCancel: () => console.log("Cancel"),
			onConfirm: () => handlePurchaseCopy(purchaseId),
		});
	};

	// =============== open purchase details view from menu (stops propagation so row click does not fire) ===============
	const handleShowPurchaseFromMenu = (event, entities) => {
		event.stopPropagation();
		handleShowDetails(entities);
	};

	// =============== delete purchase with confirmation (local SQLite) ===============
	const handleDeleteClick = (record) => {
		modals.openConfirmModal({
			title: <Text size="md"> {t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
			confirmProps: { color: "red.6" },
			labels: { confirm: "Confirm", cancel: "Cancel" },
			onCancel: () => console.log("Cancel"),
			onConfirm: () => handleConfirmDelete(record),
		});
	};

	const handleConfirmDelete = async (record) => {
		await window.dbAPI.deleteDataFromTable("purchase", { id: record.id });
		setDeletedPurchaseIds((previousIds) => new Set([ ...previousIds, record.id ]));
		showNotification(`Invoice ${record.invoice} deleted`, "teal");
	};

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<PageBreadcrumb label={t("SalesReturnList")} />
				<KeywordSearch showStartEndDate form={form} />
				<Group gap="sm" wrap="nowrap">
					<Tooltip label={t("RefreshData")}>
						<ActionIcon variant="light" color="green" size="lg" onClick={refetch}>
							<IconRefresh size={20} />
						</ActionIcon>
					</Tooltip>
					<Button
						size="xs"
						color="red"
						variant="filled"
						leftSection={<IconPlus size={20} />}
						onClick={() => navigate(APP_NAVLINKS.SALES_RETURN_NEW)}
					>
						{t("NewSalesReturn")}
					</Button>
				</Group>
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
							records={(entities?.data ?? []).filter((item) => !deletedPurchaseIds.has(item.id))}
							columns={[
								{
									accessor: "created",
									title: t("Created"),
									render: (item) => <Text size="sm">{item?.created || "N/A"}</Text>,
								},

								{
									accessor: "invoice",
									title: t("Invoice"),
									render: (item) => <Text size="sm">{item?.invoice || "N/A"}</Text>,
								},
								{
									accessor: "return_type",
									title: t("ReturnMode"),
									render: (item) => <Text size="sm">{item?.return_type || "N/A"}</Text>,
								},
								{
									accessor: "vendor_name",
									title: t("Vendor"),
									render: (item) => <Text size="sm">{item?.vendor_name || "N/A"}</Text>,
								},
								{
									accessor: "quantity",
									title: t("TotalQuantity"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.quantity || 0)}</>,
								},
								{
									accessor: "total",
									title: t("Total"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.sub_total || 0)}</>,
								},
								{
									accessor: "process",
									title: t("Status"),
									render: (item) => {
										const colorMap = {
											Created: "blue",
											Approved: "red",
										};
										const badgeColor = colorMap[ item.process ] || "gray";
										return (
											item.process && (
												<Badge variant="dot" radius="xs" color={badgeColor}>
													{item.process}
												</Badge>
											)
										);
									},
								},
								{
									accessor: "action",
									title: t("Action"),
									textAlign: "right",
									render: (data) => (
										<Group gap={4} justify="right" wrap="nowrap">
											{!data.approved_by_id &&
												data.process === "Created" &&
												data.return_type === "Requisition" && (
													<Button
														component="a"
														size="compact-sm"
														radius="xs"
														color="orange"
														variant="filled"
														fw={"100"}
														onClick={(e) => {
															e.stopPropagation();
															handleSendVendorApproveConfirm(data.id);
														}}
													>
														{t("SendToVendor")}
													</Button>
												)}
											{!data.approved_by_id &&
												data.process === "Created" &&
												data.return_type === "General" && (
													<Button
														component="a"
														size="compact-sm"
														radius="xs"
														color="indigo"
														variant="filled"
														fw={"100"}
														onClick={(e) => {
															e.stopPropagation();
															handlePurchaseApprove(data.id);
														}}
													>
														{t("Approve")}
													</Button>
												)}
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
														color="red"
														radius="xl"
														aria-label="Settings"
													>
														<IconDotsVertical height={"18"} width={"18"} stroke={1.5} />
													</ActionIcon>
												</Menu.Target>
												<Menu.Dropdown w="200">
													<Menu.Item
														onClick={(event) => handleShowPurchaseFromMenu(event, data)}
														leftSection={<IconEye height={"18"} width={"18"} stroke={1.5} />}
														color="blue"
													>
														{t("Show")}
													</Menu.Item>
													{!data.approved_by_id &&
														data.process === "Created" &&
														data.return_type === "Requisition" && (
															<Menu.Item
																onClick={(event) => {
																	event.stopPropagation();
																	handleDeleteClick(data);
																}}
																color="red"
																leftSection={<IconTrashX height={"18"} width={"18"} stroke={1.5} />}
															>
																{t("Delete")}
															</Menu.Item>
														)}
												</Menu.Dropdown>
											</Menu>
										</Group>
									),
								},
							]}
							fetching={isLoading}
							totalRecords={entities?.total || 0}
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
									? { background: "var(--theme-primary-color-0)" }
									: undefined
							}
						/>
					</Box>
				</Grid.Col>
			</Grid>
			<GlobalModal
				opened={opened}
				onClose={close}
				size="85%"
				padding="md"
				title={`${t("Purchase")}: ${viewData?.invoice || ""}`}
			>
				<Details loading={loading} viewData={viewData} />
			</GlobalModal>
		</Box>
	);
}
