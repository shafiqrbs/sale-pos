import {
	Box,
	Grid,
	Text,
	ActionIcon,
	Group,
	Menu,
	Flex,
	Button,
	SegmentedControl,
} from "@mantine/core";
import { IconDotsVertical, IconEdit, IconEye, IconPlus, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import Details from "./__Details";
import useSalesList from "@hooks/useSalesList";
import KeywordSearch from "@components/KeywordSearch";
import GlobalModal from "@components/modals/GlobalModal";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { APP_NAVLINKS } from "@/routes/routes";
import { formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { modals } from "@mantine/modals";

const PER_PAGE = 25;

export default function Table() {
	const { t } = useTranslation();
	const [opened, { open, close }] = useDisclosure(false);
	useDisclosure(false);
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [selectedRow, setSelectedRow] = useState(null);
	const [loading, setLoading] = useState(false);
	const [salesViewData, setSalesViewData] = useState(null);
	const [deletedSaleIds, setDeletedSaleIds] = useState(new Set());
	const [dataSource, setDataSource] = useState("offline");
	const { mainAreaHeight, isOnline } = useOutletContext();
	// =============== when offline, always use offline data (online segment disabled) ===============
	const effectiveDataSource = isOnline ? dataSource : "offline";
	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const { sales: salesData, isLoading } = useSalesList({
		params: {
			term: form.values.term,
			start_date: form.values.start_date,
			end_date: form.values.end_date,
			page,
			offset: PER_PAGE,
		},
		offlineFetch: effectiveDataSource === "offline",
	});

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
		await window.dbAPI.deleteDataFromTable("sales", { id: record.id });
		setDeletedSaleIds((previousIds) => new Set([...previousIds, record.id]));
		showNotification(`Invoice ${record.invoice} deleted`, "teal");
	};

	const handleShowDetails = (item) => {
		console.info("item:", item);
		setLoading(true);
		setSelectedRow(item.invoice);
		setSalesViewData(item);
		open();

		setTimeout(() => {
			setLoading(false);
		}, 700);
	};

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<KeywordSearch showStartEndDate form={form} />
				<Group gap="sm" wrap="nowrap">
					<SegmentedControl
						value={effectiveDataSource}
						onChange={(value) => {
							setDataSource(value);
							setPage(1);
						}}
						color="var(--theme-primary-color-6)"
						data={[
							{ value: "online", label: t("Online"), disabled: !isOnline },
							{ value: "offline", label: t("Offline") },
						]}
					/>
					<Button
						w={140}
						leftSection={<IconPlus size={18} />}
						onClick={() => navigate(APP_NAVLINKS.SALES_NEW)}
					>
						{t("NewSale")}
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
							records={(salesData?.data ?? []).filter((item) => !deletedSaleIds.has(item.id))}
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
										<Text component="a" size="sm" variant="subtle" c="var(--theme-primary-color-6)">
											{item.invoice}
										</Text>
									),
								},
								{
									accessor: "customerName",
									title: t("Customer"),
									render: (item) => <Text size="sm">{item?.customerName || "N/A"}</Text>,
								},
								{
									accessor: "subtotal",
									title: t("Sub Total"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.sub_total)}</>,
								},
								{
									accessor: "discount",
									title: t("Discount"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.discount)}</>,
								},
								{
									accessor: "total",
									title: t("Total"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.total)}</>,
								},
								{
									accessor: "payment",
									title: t("Receive"),
									textAlign: "right",
									render: (data) => <>{formatCurrency(data.payment)}</>,
								},
								{
									accessor: "due",
									title: t("Due"),
									textAlign: "right",
									render: (data) => {
										return <>{formatCurrency(Number(data.total) - Number(data.payment))}</>;
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
														<IconDotsVertical height="18" width="18" stroke={1.5} />
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
													<Menu.Item
														onClick={(e) => {
															e.preventDefault();
															navigate(`${APP_NAVLINKS.SALES_EDIT}/${data.id}`);
														}}
														w="140"
													>
														<Flex gap={4} align="center">
															<IconEdit size={18} />
															<Text size="sm">{t("Edit")}</Text>
														</Flex>
													</Menu.Item>
													<Menu.Item
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteClick(data);
														}}
														w="140"
														color="red"
													>
														<Flex gap={4} align="center">
															<IconTrash size={18} />
															<Text size="sm">{t("Delete")}</Text>
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
				title={`${t("Sales")}: ${salesViewData?.invoice || ""}`}
			>
				<Details loading={loading} salesViewData={salesViewData} salesData={salesData} />
			</GlobalModal>
		</Box>
	);
}
