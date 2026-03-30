/**
 * Shared inventory list table used by Sales, Purchase, Requisition,
 * and Purchase Return modules.
 *
 * Previously each module had its own _Table.jsx (~350 lines each, 70-75%
 * identical code). Bugs in one copy weren't fixed in others, causing
 * wrong delete table names, wrong edit paths, and inconsistent behavior.
 *
 * Now each module provides a config object describing its unique columns,
 * data hook, action menu, and navigation. Everything else — state management,
 * search, DataTable chrome, delete-with-confirm, details modal — lives here once.
 */
import { useState } from "react";
import { Box, Grid, Text, Button, Group, Flex, SegmentedControl } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useNavigate, useOutletContext } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import KeywordSearch from "@components/KeywordSearch";
import GlobalModal from "@components/modals/GlobalModal";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { modals } from "@mantine/modals";

const PER_PAGE = 25;

export default function InventoryTable({ config }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [opened, { open, close }] = useDisclosure(false);
	const [page, setPage] = useState(1);
	const [selectedRow, setSelectedRow] = useState(null);
	const [loading, setLoading] = useState(false);
	const [viewData, setViewData] = useState(null);
	const [deletedIds, setDeletedIds] = useState(new Set());
	const [dataSource, setDataSource] = useState("offline");
	const { mainAreaHeight, isOnline } = useOutletContext();

	const showToggle = config.showDataSourceToggle !== false;
	const effectiveDataSource = showToggle ? (isOnline ? dataSource : "offline") : "online";

	const form = useForm({
		initialValues: { term: "", start_date: "", end_date: "" },
	});

	// Each module normalizes its data hook to return { data, total, isLoading }
	const { data, total, isLoading } = config.useData({
		params: {
			term: form.values.term,
			start_date: form.values.start_date,
			end_date: form.values.end_date,
			page,
			offset: PER_PAGE,
		},
		effectiveDataSource,
	});

	// Optional: approve/copy mutations (Purchase, Requisition, Purchase Return)
	const mutations = config.useMutations ? config.useMutations() : {};

	// Optional: module-specific hooks (Sales needs useDispatch + useConfigData)
	const extraHookData = config.useExtraHooks ? config.useExtraHooks() : {};

	// ---- Shared handlers ----

	const handleShowDetails = (item) => {
		setLoading(true);
		setSelectedRow(item.invoice);
		setViewData(item);
		open();
		setTimeout(() => setLoading(false), 700);
	};

	const handleConfirmDelete = async (record) => {
		await window.dbAPI.deleteDataFromTable(config.moduleName, { id: record.id });
		setDeletedIds((prev) => new Set([...prev, record.id]));
		showNotification(`Invoice ${record.invoice} deleted`, "teal");
	};

	const handleDeleteClick = (record) => {
		modals.openConfirmModal({
			title: <Text size="md">{t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
			confirmProps: { color: "red.6" },
			labels: { confirm: "Confirm", cancel: "Cancel" },
			onCancel: () => console.log("Cancel"),
			onConfirm: () => handleConfirmDelete(record),
		});
	};

	const handleApprove = (id) => {
		modals.openConfirmModal({
			title: <Text size="md">{t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
			labels: { confirm: t("Submit"), cancel: t("Cancel") },
			confirmProps: { color: "red" },
			onCancel: () => console.log("Cancel"),
			onConfirm: async () => {
				try {
					const res = await mutations.approve(id);
					if (res.data.status === 200) {
						showNotification(t("ApprovedSuccessfully"), "teal");
					}
				} catch (error) {
					console.error("Error approving:", error);
					showNotification(error?.data?.message || t("ApproveFailed"), "red");
				}
			},
		});
	};

	const handleCopy = (id) => {
		modals.openConfirmModal({
			title: <Text size="md">{t("CopyPurchase")}</Text>,
			children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
			labels: { confirm: "Confirm", cancel: "Cancel" },
			onCancel: () => console.log("Cancel"),
			onConfirm: async () => {
				try {
					const res = await mutations.copy(id);
					if (res.data.status === 200) {
						showNotification(t("CopyPurchaseSuccessfully"), "teal");
					}
				} catch (error) {
					console.error("Error copying:", error);
					showNotification(error?.data?.message || t("CopyPurchaseFailed"), "red");
				}
			},
		});
	};

	// Bundle handlers so modules can use them in getColumns
	const handlers = {
		showDetails: handleShowDetails,
		deleteRecord: handleDeleteClick,
		approve: handleApprove,
		copy: handleCopy,
	};

	const records = (data ?? []).filter((item) => !deletedIds.has(item.id));

	const columns = config.getColumns({
		t,
		formatCurrency,
		handlers,
		navigate,
		extraHookData,
	});

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<KeywordSearch showStartEndDate form={form} />
				<Group gap="sm" wrap="nowrap">
					{showToggle && (
						<SegmentedControl
							size="xs"
							value={effectiveDataSource}
							onChange={(value) => {
								setDataSource(value);
								setPage(1);
							}}
							color={effectiveDataSource === "online" ? "green" : "orange"}
							data={[
								{ value: "online", label: t("Online"), disabled: !isOnline },
								{ value: "offline", label: t("Offline") },
							]}
						/>
					)}
					<Button
						size="xs"
						color="red.6"
						variant="filled"
						leftSection={<IconPlus size={16} />}
						onClick={() => config.onNewClick({ navigate, extraHookData })}
					>
						{t(config.newButtonLabel)}
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
							onRowClick={(rowData) => handleShowDetails(rowData.record)}
							records={records}
							columns={columns}
							fetching={isLoading}
							totalRecords={total || 0}
							recordsPerPage={PER_PAGE}
							loaderSize="xs"
							loaderColor="grape"
							page={page}
							onPageChange={(p) => setPage(p)}
							height={mainAreaHeight - 54}
							scrollAreaProps={{ type: "never" }}
							rowStyle={(item) =>
								item.invoice === selectedRow
									? config.selectedRowStyle || { background: "var(--theme-primary-color-0)" }
									: undefined
							}
						/>
					</Box>
				</Grid.Col>
			</Grid>

			<GlobalModal
				opened={opened}
				onClose={close}
				size={config.modalSize || "80%"}
				padding="md"
				title={config.getModalTitle({ t, viewData })}
			>
				{config.renderDetails({ loading, viewData, listData: { data, total } })}
			</GlobalModal>
		</Box>
	);
}
