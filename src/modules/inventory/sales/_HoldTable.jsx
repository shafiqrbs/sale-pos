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
import {
	IconDotsVertical,
	IconEdit,
	IconEye,
	IconPlus,
	IconTrash,
	IconChevronRight,
	IconGlobe,
	IconGlobeOff,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
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
import { setEditingSale } from "@features/checkout";
import useLoggedInUser from "@hooks/useLoggedInUser";

const PER_PAGE = 25;

export default function HoldTable() {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [ opened, { open, close } ] = useDisclosure(false);
	useDisclosure(false);
	const navigate = useNavigate();
	const [ page, setPage ] = useState(1);
	const [ selectedRow, setSelectedRow ] = useState(null);
	const [ loading, setLoading ] = useState(false);
	const [ salesViewData, setSalesViewData ] = useState(null);
	const [ deletedSaleIds, setDeletedSaleIds ] = useState(new Set());
	const [ dataSource, setDataSource ] = useState("offline");
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

	const { sales: salesData, isLoading } = useSalesList({
		params: {
			term: form.values.term,
			start_date: form.values.start_date,
			end_date: form.values.end_date,
			page,
			offset: PER_PAGE,
			status: "hold",
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
		setDeletedSaleIds((previousIds) => new Set([ ...previousIds, record.id ]));
		showNotification(t("InvoiceDeletedSuccess", { invoice: record.invoice }), "teal");
	};

	const handleProcess = async (data) => {
		try {
			// Clear existing cart items
			const existingItems = await window.dbAPI.getDataFromTable("invoice_table_item");
			if (existingItems?.length) {
				const ids = existingItems.map((item) => item.id);
				await window.dbAPI.deleteManyFromTable("invoice_table_item", ids);
			}

			// Parse saved sale items and insert into invoice_table_item
			const salesItems = JSON.parse(data.sales_items || "[]");
			for (const item of salesItems) {
				await window.dbAPI.upsertIntoTable("invoice_table_item", {
					stock_item_id: item.stock_item_id,
					display_name: item.display_name,
					quantity: item.quantity,
					quantity_limit: item.quantity_limit || 0,
					purchase_price: item.purchase_price || 0,
					sales_price: item.sales_price,
					custom_price: item.custom_price || 0,
					is_print: item.is_print || 0,
					sub_total: item.sub_total,
					batches: typeof item.batches === "string" ? item.batches : JSON.stringify(item.batches || []),
				});
			}

			// Store sale metadata in Redux for the POS page to restore
			dispatch(setEditingSale({
				id: data.id,
				customerId: data.customerId,
				customerName: data.customerName,
				customerMobile: data.customerMobile,
				customer_address: data.customer_address,
				salesById: data.salesById,
				discount: data.discount,
				discount_type: data.discount_type,
				payments: data.payments,
				status: data.status,
			}));

			navigate(APP_NAVLINKS.BAKERY);
		} catch (err) {
			console.error("Error loading hold sale into POS:", err);
			showNotification(t("FailedToLoadSaleIntoPOS"), "red");
		}
	};

	const handleShowDetails = (item) => {
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
						w={170}
						size="md"
						color="red"
						variant="filled"
						leftSection={<IconPlus size={20} />}
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
										<Text component="a" size="sm" variant="subtle">
											{item?.created}
										</Text>
									),
								},
								{
									accessor: "invoice",
									title: t("Invoice"),
									render: (item) => (
										<Text component="a" size="sm" variant="subtle" c="red">
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
											<Button
												size="xs"
												color="red"
												aria-label="Settings"
												rightSection={<IconChevronRight size={20} />}
												onClick={(e) => {
													e.stopPropagation();
													handleProcess(data);
												}}
											>
												{t("Process")}
											</Button>
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
				size="xl"
				padding="md"
				title={`${t("Sales")}: ${salesViewData?.invoice || ""}`}
			>
				<Details loading={loading} salesViewData={salesViewData} salesData={salesData} />
			</GlobalModal>
		</Box>
	);
}
