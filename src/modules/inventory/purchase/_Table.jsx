import { useState } from "react";
import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button, Badge, SegmentedControl } from "@mantine/core";
import { IconCopy, IconDotsVertical, IconEdit, IconEye, IconPlus, IconTrashX, IconGlobe, IconGlobeOff } from "@tabler/icons-react";
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
import {
	useApprovePurchaseMutation,
	useCopyPurchaseMutation,
} from "@services/purchase";
import usePurchaseList from "@hooks/usePurchaseList";
import useLocalProducts from "@hooks/useLocalProducts";
import { modals } from "@mantine/modals";
import { showNotification } from "@components/ShowNotificationComponent";
import { formatCurrency } from "@utils/index";
import useLoggedInUser from "@hooks/useLoggedInUser";

const PER_PAGE = 25;

export default function Table() {
	const [approvePurchase] = useApprovePurchaseMutation();
	const [copyPurchase] = useCopyPurchaseMutation();
	const { syncOnlineProductsToLocal } = useLocalProducts({ fetchOnMount: false });
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [opened, { open, close }] = useDisclosure(false);
	const [page, setPage] = useState(1);
	const [selectedRow, setSelectedRow] = useState(null);
	const [loading, setLoading] = useState(false);
	const [viewData, setViewData] = useState(null);
	const [deletedPurchaseIds, setDeletedPurchaseIds] = useState(new Set());
	const [dataSource, setDataSource] = useState("offline");
	const { mainAreaHeight, isOnline } = useOutletContext();
	const { isOnlinePermissionIncludes } = useLoggedInUser();
	// =============== when offline or user lacks permission, always use offline data ===============
	const effectiveDataSource = isOnline && isOnlinePermissionIncludes ? dataSource : "offline";

	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const { purchases: purchaseData, isLoading } = usePurchaseList({
		params: {
			term: form.values.term,
			start_date: form.values.start_date,
			end_date: form.values.end_date,
			page,
			offset: PER_PAGE,
		},
		offlineFetch: effectiveDataSource === "offline",
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
			const res = await approvePurchase(id);

			if (res.data.status === 200) {
				showNotification(t("ApprovedSuccessfully"), "teal");

				// =============== silently refresh local product stock after approval ================
				if (isOnline) {
					syncOnlineProductsToLocal({
						type: "product",
						product_nature: "allstocks",
					});
				}
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
	const handleShowPurchaseFromMenu = (event, purchaseData) => {
		event.stopPropagation();
		handleShowDetails(purchaseData);
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
		showNotification(`Invoice ${record.invoice} deleted`, "teal");
	};

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<KeywordSearch showStartEndDate form={form} />

				<Group gap="sm" wrap="nowrap" >
				{isOnline && isOnlinePermissionIncludes && (
					<SegmentedControl
						value={effectiveDataSource}
						onChange={(value) => {
							setDataSource(value);
							setPage(1);
						}}
						color={effectiveDataSource === "online" ? "green" : "red"}
						data={[
							{
								value: "online",
								label: (
									<Group gap={4} wrap="nowrap">
										<IconGlobe size={13} color={effectiveDataSource === "online" ? "white" : "var(--mantine-color-green-6)"} />
										{t("Online")}
									</Group>
								),
							},
							{
								value: "offline",
								label: (
									<Group gap={4} wrap="nowrap">
										<IconGlobeOff size={13} color={effectiveDataSource === "offline" ? "white" : "var(--mantine-color-red-6)"} />
										{t("Offline")}
									</Group>
								),
							},
						]}
					/>
				)}
					<Button
						size="xs"
						color="red"
						variant="filled"
						leftSection={<IconPlus size={20} />}
						onClick={() => navigate(APP_NAVLINKS.PURCHASE_NEW)}
					>
						{t("NewPurchase")}
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
							records={(purchaseData?.data ?? []).filter((item) => !deletedPurchaseIds.has(item.id))}
							columns={[
								{
									accessor: "created",
									title: t("Created"),
									render: (item) => (
										<Text component="a" size="sm" variant="subtle">
											{item?.created}
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
									accessor: "subtotal",
									title: t("Sub Total"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.sub_total || 0)}</>,
								},
								{
									accessor: "discount",
									title: t("Discount"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.discount || 0)}</>,
								},
								{
									accessor: "total",
									title: t("Total"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.total || 0)}</>,
								},
								{
									accessor: "due",
									title: t("Payable"),
									textAlign: "right",
									render: (data) => {
										return <>{formatCurrency(Number(data.total) - Number(data.payment))}</>;
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

										const badgeColor = colorMap[item.process] || "gray";

										return item.process && <Badge color={badgeColor}>{item.process}</Badge>;
									},
								},
								{
									accessor: "action",
									title: t("Action"),
									textAlign: "right",
									render: (data) => (

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
													<Menu.Item
														onClick={(event) => {
															event.stopPropagation();
															navigate(`${APP_NAVLINKS.PURCHASE_EDIT}/${data.id}`);
														}}
														leftSection={<IconEdit height={"18"} width={"18"} stroke={1.5} />}
														color="yellow"
													>
														{t("Edit")}
													</Menu.Item>
													{
														<Menu.Item
															color="indigo"
															onClick={() => handleOpenCopyConfirmModal(data.id)}
															leftSection={<IconCopy height={"18"} width={"18"} stroke={1.5} />}
														>
															{t("Copy")}
														</Menu.Item>
													}
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
									? { background: "var(--theme-primary-color-3)", color: "#ffffff" }
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
				title={`${t("Purchase")}: ${viewData?.invoice || ""}`}
			>
				<Details loading={loading} viewData={viewData} />
			</GlobalModal>
		</Box>
	);
}
