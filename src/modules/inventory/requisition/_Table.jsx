import { useState } from "react";
import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button, Badge, Tooltip } from "@mantine/core";
import {
	IconCopy,
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
import { useCopyPurchaseMutation } from "@services/purchase";
import { modals } from "@mantine/modals";
import { showNotification } from "@components/ShowNotificationComponent";
import { formatCurrency } from "@utils/index";
import { useApproveRequisitionMutation, useGetRequisitionQuery } from "@services/requisition";

const PER_PAGE = 25;
const RESTRICTED_STATUSES = ["generated", "approved"];

export default function Table() {
	const [approveRequisition] = useApproveRequisitionMutation();
	const [copyPurchase] = useCopyPurchaseMutation();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [opened, { open, close }] = useDisclosure(false);
	const [page, setPage] = useState(1);
	const [selectedRow, setSelectedRow] = useState(null);
	const [loading, setLoading] = useState(false);
	const [viewData, setViewData] = useState(null);
	const [deletedPurchaseIds, setDeletedPurchaseIds] = useState(new Set());
	const { mainAreaHeight } = useOutletContext();

	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const { data: entities, isLoading, refetch } = useGetRequisitionQuery({
		params: {
			term: form.values.term,
			start_date: form.values.start_date,
			end_date: form.values.end_date,
			page,
			offset: PER_PAGE,
		},
	});

	const handleRequisitionApprove = (id) => {
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
				handleRequisitionApproveConfirm(id);
			},
		});
	};

	const handleRequisitionApproveConfirm = async (id) => {
		try {
			const res = await approveRequisition(id);

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
		console.info("item:", item);
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
		setDeletedPurchaseIds((previousIds) => new Set([...previousIds, record.id]));
		showNotification(t("InvoiceDeletedSuccess", { invoice: record.invoice }), "teal");
	};

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<KeywordSearch showStartEndDate form={form} />
				<Group gap="sm" wrap="nowrap">
					<Tooltip label={t("RefreshData")}>
						<ActionIcon variant="light" color="green" size="lg" onClick={refetch}>
							<IconRefresh size={20} />
						</ActionIcon>
					</Tooltip>
					<Button
						size="md"
						color="red"
						variant="filled"
						leftSection={<IconPlus size={20} />}
						onClick={() => navigate(APP_NAVLINKS.REQUISITION_NEW)}
					>
						{t("NewRequisition")}
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
									render: (item) => (
										<Text component="a" size="sm" variant="subtle" c="var(--theme-primary-color-6)">
											{item?.created}
										</Text>
									),
								},
								{
									accessor: "expected_date",
									title: t("ExpectedDate"),
									render: (item) => (
										<Text component="a" size="sm" variant="subtle" c="var(--theme-primary-color-6)">
											{item?.expected_date}
										</Text>
									),
								},
								{
									accessor: "invoice",
									title: t("Invoice"),
									render: (item) => (
										<Text component="a" size="sm" variant="subtle" c="var(--theme-primary-color-6)">
											{item.invoice}
										</Text>
									),
								},
								{
									accessor: "vendor_name",
									title: t("Vendor"),
									render: (item) => <Text size="sm">{item?.vendor_name || "N/A"}</Text>,
								},
								{
									accessor: "total",
									title: t("Total"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.total || 0)}</>,
								},
								{
									accessor: "process",
									title: t("Status"),
									width: "130px",
									render: (item) => {
										const colorMap = {
											Created: "blue",
											Approved: "red",
										};
										const badgeColor = colorMap[item.process] || "gray";
										return item.process && <Badge color={badgeColor}>{item.process}</Badge>;
									},
								},
								{
									accessor: "action",
									title: t("Action"),
									textAlign: "right",
									render: (data) => {
										const isRestricted = RESTRICTED_STATUSES.includes(data?.process?.toLowerCase());
										return (
										<Group gap={4} justify="right" wrap="nowrap">
											{!data.approved_by_id && (
												<Button
													component="a"
													size="compact-xs"
													radius="xs"
													variant="filled"
													fw={"100"}
													fz={"12"}
													color="var(--theme-secondary-color-8)"
													mr={"4"}
													onClick={(e) => {
														e.stopPropagation();
														handleRequisitionApprove(data.id);
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
													{!isRestricted && (
														<Menu.Item
															onClick={(event) => {
																event.stopPropagation();
																navigate(`${APP_NAVLINKS.REQUISITION_EDIT}/${data.id}`);
															}}
															leftSection={<IconEdit height="18" width="18" stroke={1.5} />}
															color="yellow"
														>
															{t("Edit")}
														</Menu.Item>
													)}
													{
														<Menu.Item
															color="indigo"
															onClick={() => handleOpenCopyConfirmModal(data.id)}
															leftSection={<IconCopy height="18" width="18" stroke={1.5} />}
														>
															{t("Copy")}
														</Menu.Item>
													}
													{!isRestricted && (
														<Menu.Item
															onClick={(event) => {
																event.stopPropagation();
																handleDeleteClick(data);
															}}
															color="red"
															leftSection={<IconTrashX height="18" width="18" stroke={1.5} />}
														>
															{t("Delete")}
														</Menu.Item>
													)}
												</Menu.Dropdown>
											</Menu>
										</Group>
									);
									},
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
				size="80%"
				padding="md"
				title={`${t("Requisition No")}: ${viewData?.invoice || ""}`}
			>
				<Details loading={loading} viewData={viewData} />
			</GlobalModal>
		</Box>
	);
}
