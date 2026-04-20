import {
	Divider,
	Stack,
	Paper,
	Group,
	Text,
	ActionIcon,
	rem,
	Flex,
	LoadingOverlay,
	Tabs,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconRefresh, IconCloudUpload, IconCloudDownload } from "@tabler/icons-react";
import { DATA_MAP, SYNC_DATA } from "@/constants";
import { showNotification } from "@components/ShowNotificationComponent";
import { useSyncPosMutation } from "@services/pos";
import GlobalDrawer from "../drawers/GlobalDrawer";
import {
	formatDateTime,
	generateUniqueId,
	getLastSyncRecord,
	getLastSyncRecordByMode,
	getSyncRecordsFromLocalStorage,
	saveSyncRecordToLocalStorage,
} from "@utils/index";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { apiSlice } from "@services/api.mjs";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import axios from "axios";
import { APP_NAVLINKS, MASTER_APIS } from "@/routes/routes";
import DatabaseInsertProgress from "@components/DatabaseInsertProgress";
import { useTranslation } from "react-i18next";

const TABLE_MAPPING = {
	sales: "sales",
	purchase: "purchase",
	products: "products",
	customers: "customers",
	vendors: "vendors",
};

const EXPORT_MODES = ["sales", "purchase", "customers", "vendors"];

const IMPORT_ITEMS = [
	{ mode: "platform", label: "Platform Sync", description: "Sync all platform data from server" },
	{ mode: "customers", label: "Customers", description: "Import customer data from server" },
	{ mode: "vendors", label: "Vendors", description: "Import vendor data from server" },
];

const HOLDABLE_TABLES = ["sales"];

export default function SyncDrawer({
	configData,
	syncPanelOpen,
	setSyncPanelOpen,
	quickPlatformSyncRequested,
	onQuickPlatformSyncHandled,
}) {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const [syncPos] = useSyncPosMutation();
	const [syncRecords, setSyncRecords] = useState(() => getSyncRecordsFromLocalStorage());
	const [loadingStates, setLoadingStates] = useState(() => {
		return SYNC_DATA.reduce((accumulator, item) => {
			accumulator[item.mode] = false;
			return accumulator;
		}, {});
	});
	const [platformSyncing, setPlatformSyncing] = useState(false);
	const [isInserting, setIsInserting] = useState(false);
	const [insertProgress, setInsertProgress] = useState(null);
	const [activeTab, setActiveTab] = useState("export");
	const lastSyncRecord = useMemo(() => getLastSyncRecord(syncRecords), [syncRecords]);

	useEffect(() => {
		if (quickPlatformSyncRequested) {
			onQuickPlatformSyncHandled?.();
			confirmAndSyncPlatform();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [quickPlatformSyncRequested]);

	const buildSalesSyncPayload = (sale) => {
		const items = [];

		const salesItems = JSON.parse(sale?.sales_items || "[]");

		salesItems?.forEach((item) => {
			const itemBody = {
				id: item?.id ?? null,
				stock_item_id: item?.stock_item_id ?? null,
				invoice_id: item?.invoice_id ?? null,

				display_name: item?.display_name ?? "",
				quantity: item?.quantity ?? 0,

				purchase_price: item?.purchase_price ?? 0,
				sales_price: item?.sales_price ?? 0,
				custom_price: item?.custom_price ?? 0,

				is_print: item?.is_print ?? 0,
				sub_total: item?.sub_total ?? 0,

				category_id: item?.category_id ?? null,
				category_name: item?.category_name ?? "",

				purchase_item_id: null,

				created_at: item?.created_at ?? "",
				updated_at: item?.updated_at ?? "",
			};

			const batchItems = JSON.parse(item.batches || "[]");

			if (batchItems.length) {
				batchItems.forEach((batch) => {
					items.push({
						...itemBody,
						quantity: batch.quantity,
						purchase_item_id: batch.id,
					});
				});
			} else {
				items.push(itemBody);
			}
		});

		return items;
	};

	const buildPurchasesSyncPayload = (purchase) => {
		const purchaseItems = JSON.parse(purchase?.purchase_items || "[]");

		return purchaseItems.map((item) => ({
			product_id: item?.product_id ?? null,
			display_name: item?.display_name ?? "",
			quantity: item?.quantity ?? 0,
			mrp: item?.mrp ?? 0,
			purchase_price: item?.purchase_price ?? 0,
			sales_price: item?.sales_price ?? 0,
			sub_total: item?.sub_total ?? 0,
			category_id: item?.category_id ?? null,
			category_name: item?.category_name ?? "",
			unit_name: item?.unit_name ?? "",
			bonus_quantity: item?.bonus_quantity ?? 0,
			average_price: item?.average_price ?? 0,
			expired_date: item?.expired_date ?? "",
			sales_quantity: item?.sales_quantity ?? 0,
		}));
	};

	const buildSyncPayload = ({ syncType, syncData }) => {
		const basePayload = {
			device_id: `DESKTOP_DEVICE_${configData?.domain_id ?? 123}`,
			sync_batch_id: generateUniqueId(),
		};

		switch (syncType) {
			case "sales": {
				return {
					...basePayload,
					content: syncData.map((sale) => ({
						id: sale?.id ?? null,
						created: sale?.created ?? "",
						invoice: sale?.invoice ?? "",

						sub_total: sale?.sub_total ?? null,
						total: sale?.total ?? null,
						approved_by_id: sale?.approved_by_id || null,

						payment: sale?.payment ?? null,
						discount: sale?.discount ?? null,
						is_domain_sales_completed: sale?.is_domain_sales_completed ?? null,

						discount_calculation: sale?.discount_calculation ?? null,
						discount_type: sale?.discount_type ?? null,

						invoice_batch_id: sale?.invoice_batch_id ?? null,

						customerId: sale?.customerId ?? "",
						customerName: sale?.customerName ?? configData?.domain?.name ?? "",

						customerMobile: sale?.customerMobile ?? null,

						createdByUser: sale?.createdByUser ?? "",
						createdByName: sale?.createdByName ?? null,
						createdById: sale?.createdById || null,

						salesById: sale?.salesById || null,
						salesByUser: sale?.salesByUser ?? "",
						salesByName: sale?.salesByName ?? null,

						process: sale?.process ?? "",
						mode_name: sale?.mode_name ?? "",

						customer_address: sale?.customer_address ?? null,
						customer_group: sale?.customer_group ?? null,
						balance: sale?.balance ?? null,

						purchase_item_id: null,

						sales_items: buildSalesSyncPayload(sale),

						multi_transaction: sale?.multi_transaction ?? 0,

						payments: JSON.parse(sale?.payments || "[]")?.map((payment) => ({
							transaction_mode_id: payment?.transaction_mode_id ?? null,
							transaction_mode_name: payment?.transaction_mode_name ?? null,
							invoice_id: sale?.invoice ?? "",
							amount: payment?.amount ?? 0,
							remark: payment?.remark ?? "",
						})),
					})),
					sync_type: "sales",
				};
			}

			case "purchase": {
				return {
					...basePayload,
					content: syncData.map((purchase) => ({
						id: purchase?.id ?? null,
						created: purchase?.created ?? "",
						invoice: purchase?.invoice ?? "",

						sub_total: purchase?.sub_total ?? 0,
						total: purchase?.total ?? 0,
						payment: purchase?.payment ?? 0,
						due: purchase?.due ?? 0,
						discount: purchase?.discount ?? 0,
						discount_calculation: purchase?.discount_calculation ?? 0,
						discount_type: purchase?.discount_type ?? "",

						approved_by_id: purchase?.approved_by_id ?? null,

						vendor_id: purchase?.vendor_id ?? null,
						vendor_name: purchase?.vendor_name ?? "",

						createdByUser: purchase?.createdByUser ?? "",
						createdByName: purchase?.createdByName ?? "",
						createdById: purchase?.createdById ?? null,

						process: purchase?.process ?? "",
						mode_name: purchase?.mode_name ?? "",
						transaction_mode_id: purchase?.transaction_mode_id ?? null,

						purchase_mode: purchase?.purchase_mode ?? "manual",
						balance: purchase?.balance ?? 0,

						purchase_items: buildPurchasesSyncPayload(purchase),
					})),
					sync_type: "purchase",
				};
			}
			case "products":
				return {
					...basePayload,
					content: syncData.map(() => ({})),
				};
			case "customers":
			case "vendors":
				// =============== generic payload structure for other sync types ================
				return {
					...basePayload,
					content: syncData || [],
				};

			default:
				return basePayload;
		}
	};

	const runSync = async (syncOption) => {
		setLoadingStates((previousStates) => ({
			...previousStates,
			[syncOption]: true,
		}));

		try {
			let tableName = syncOption;
			let syncData = null;

			tableName = TABLE_MAPPING[syncOption] || syncOption;

			const fetchOption = HOLDABLE_TABLES.includes(syncOption) ? { status: "completed" } : {};
			syncData = await window.dbAPI.getDataFromTable(tableName, fetchOption);

			const payload = buildSyncPayload({ syncType: syncOption, syncData: syncData || [] });

			// return console.log({ syncType: syncOption, ...payload });
			const response = await syncPos({ syncType: syncOption, ...payload }).unwrap();

			if (response?.status === "error") {
				showNotification(
					response?.message || `Error syncing ${syncOption} data`,
					"red",
					"",
					"",
					true
				);
			} else {
				const nextSyncRecords = saveSyncRecordToLocalStorage({
					mode: syncOption,
					syncedAt: new Date().toISOString(),
				});
				setSyncRecords(nextSyncRecords);

				// silently destroy the table data after successful sync (preserve hold sales)
				if (HOLDABLE_TABLES.includes(tableName)) {
					window.dbAPI.deleteDataFromTable(tableName, { status: "completed" });
				} else {
					window.dbAPI.destroyTableData(tableName);
				}

				showNotification(`Successfully synced ${syncOption} data`, "teal", "", "", true);

				// reload the window to reflect synced state (main process reloads BrowserWindow)
				setTimeout(() => {
					void window.dbAPI.reloadApp();
				}, 1000);

				// overall platform sync
				// runSyncPlatform();
			}
		} catch (error) {
			console.error(`Error syncing ${syncOption} data:`, error);
			showNotification(t("FailedToSyncData", { syncOption }), "red", "", "", true);
		} finally {
			setLoadingStates((previousStates) => ({
				...previousStates,
				[syncOption]: false,
			}));
		}
	};

	const confirmAndSync = (syncOption) => {
		modals.openConfirmModal({
			title: "Confirm sync",
			children: (
				<Text size="sm">
					Are you sure you want to sync{" "}
					<Text span fw={600} tt="capitalize">
						{syncOption}
					</Text>{" "}
					data now? Local data will be cleared after the successful sync but available in the online
					database.
				</Text>
			),
			labels: { confirm: "Sync now", cancel: "Cancel" },
			confirmProps: { color: "teal", leftSection: <IconRefresh size={20} /> },
			onConfirm: () => runSync(syncOption),
		});
	};

	const confirmAndSyncPlatform = () => {
		modals.openConfirmModal({
			title: "Confirm sync",
			children: (
				<Text size="sm">
					Are you sure you want to sync platform data now? Local data will be cleared after the
					successful sync but available in the online database.
				</Text>
			),
			labels: { confirm: "Sync now", cancel: "Cancel" },
			confirmProps: { color: "teal", leftSection: <IconRefresh size={20} /> },
			onConfirm: () => runSyncPlatform(),
		});
	};

	const runSyncPlatform = async () => {
		setPlatformSyncing(true);

		try {
			const licenseActivateData = await window.dbAPI.getDataFromTable("license_activate");

			if (!licenseActivateData?.license_key || !licenseActivateData?.active_key) {
				showNotification(
					"License or activation key not found. Please activate your account first.",
					"red",
					"",
					"",
					true
				);
				return;
			}

			const licenseKey = licenseActivateData.license_key;
			const activeKey = licenseActivateData.active_key;

			// =============== call the activation url to get fresh data ================
			const response = await axios({
				url: `${MASTER_APIS.SPLASH}?license_key=${licenseKey}&active_key=${activeKey}`,
			});

			if (response.data.status !== 200) {
				showNotification(
					response.data.message || "Failed to sync platform data",
					"red",
					"",
					"",
					true
				);
				return;
			}

			// =============== register progress listener before sequential inserts begin ================
			window.dbAPI.onDBProgress((progress) => {
				setInsertProgress(progress);
			});

			setIsInserting(true);
			setPlatformSyncing(false);

			let is_pos = 0;

			try {
				// =============== insert tables one by one so progress displays per-table ================
				for (const [table, property] of Object.entries(DATA_MAP)) {
					const dataList = Array.isArray(response.data.data[property])
						? response.data.data[property]
						: [response.data.data[property]];

					// =============== config_data is a single object, format it before inserting ================
					if (table === "config_data") {
						const formattedData = dataList.map((data) => ({
							id: 1,
							data: JSON.stringify(data),
						}));

						is_pos = dataList[0]?.inventory_config?.is_pos ?? dataList[0]?.is_pos ?? 0;
						await window.dbAPI.clearAndInsertBulk(table, formattedData, { batchSize: 500 });
					} else {
						await window.dbAPI.clearAndInsertBulk(table, dataList, { batchSize: 500 });
					}
				}
			} finally {
				window.dbAPI.removeDBProgressListener();
				setIsInserting(false);
				setInsertProgress(null);
			}

			await window.dbAPI.destroyTableData("invoice_table");

			const targetPath = is_pos ? APP_NAVLINKS.BAKERY : APP_NAVLINKS.SALES_NEW;
			const hashSegment = window.location.hash.replace(/^#/, "").split("?")[0];
			const currentPathname = hashSegment === "" ? "/" : hashSegment;

			// =============== only adjust route when user is on pos bakery or new sales entry (login-style routing) ================
			const isSalesNewOrBakeryRoute =
				currentPathname === APP_NAVLINKS.SALES_NEW ||
				currentPathname === APP_NAVLINKS.BAKERY ||
				currentPathname.startsWith(`${APP_NAVLINKS.SALES_NEW}/`) ||
				currentPathname.startsWith(`${APP_NAVLINKS.BAKERY}/`);

			if (isSalesNewOrBakeryRoute && currentPathname !== targetPath) {
				navigate(targetPath, { replace: true });
			}

			// =============== save sync record ================
			const nextSyncRecords = saveSyncRecordToLocalStorage({
				mode: "platform",
				syncedAt: new Date().toISOString(),
			});
			setSyncRecords(nextSyncRecords);

			showNotification(t("PlatformDataSyncedSuccessfully"), "teal", "lightgray", "", "", true);

			dispatch(apiSlice.util.invalidateTags(["Sales"]));

			setTimeout(() => {
				void window.dbAPI.reloadApp();
			}, 100);
		} catch (error) {
			console.error("Error syncing platform data:", error);
			showNotification(
				error?.response?.data?.message ||
					error?.message ||
					"Failed to sync platform data. Please try again.",
				"red",
				"",
				"",
				true
			);
		} finally {
			setPlatformSyncing(false);
		}
	};

	const getLastModeRecord = (mode) => {
		const lastModeRecord = getLastSyncRecordByMode(syncRecords, mode);
		if (!lastModeRecord?.syncedAt) return "Not synced yet";
		return `Last synced: ${formatDateTime(new Date(lastModeRecord.syncedAt))}`;
	};

	return (
		<>
			{/* =============== full-screen spinner while fetching data from the server ================ */}
			{createPortal(
				<LoadingOverlay
					h="100vh"
					zIndex={999}
					visible={platformSyncing}
					style={{ position: "fixed", inset: 0 }}
				/>,
				document.body
			)}

			{/* =============== progress overlay while writing batches into the local db ================ */}
			{createPortal(
				<DatabaseInsertProgress visible={isInserting} progress={insertProgress} />,
				document.body
			)}
			<GlobalDrawer
				opened={syncPanelOpen}
				onClose={() => setSyncPanelOpen(false)}
				title="Syncing Information"
				styles={{
					title: { fontWeight: 600, fontSize: rem(20), color: "#626262" },
				}}
			>
				<Divider mb="lg" />

				<Tabs
					value={activeTab}
					onChange={setActiveTab}
					variant="pills"
					styles={{
						list: {
							backgroundColor: "#f1f3f5",
							borderRadius: "10px",
							padding: "4px",
							gap: "4px",
							"&::before": { display: "none" },
						},
						tab: {
							flex: 1,
							justifyContent: "center",
							borderRadius: "8px",
							fontWeight: 600,
							fontSize: "14px",
							border: "none",
							transition: "all 0.15s ease",
							"&[data-active]": {
								backgroundColor: "#ffffff",
								color: "white",
								boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
							},
							"&:hover:not([data-active])": {
								backgroundColor: "#e9ecef",
								color: "#495057",
							},
						},
					}}
				>
					<Tabs.List grow mb="xl">
						<Tabs.Tab value="export" leftSection={<IconCloudUpload size={16} />}>
							Export
						</Tabs.Tab>
						<Tabs.Tab value="import" leftSection={<IconCloudDownload size={16} />}>
							Import
						</Tabs.Tab>
					</Tabs.List>

					{/* =============== export tab: push local data to the cloud server ================ */}
					<Tabs.Panel value="export">
						<Stack gap="md">
							{SYNC_DATA.filter((item) => EXPORT_MODES.includes(item.mode)).map((item, index) => (
								<Paper key={index} p="md" radius="md" withBorder shadow="sm">
									<Group justify="space-between" wrap="nowrap">
										<Stack gap={4}>
											<Text fw={600} tt="capitalize">
												{item.mode}
											</Text>
											<Text size="sm" c="dimmed">
												{getLastModeRecord(item.mode)}
											</Text>
										</Stack>
										<ActionIcon
											loading={loadingStates[item.mode] || false}
											loaderProps={{
												children: (
													<Flex justify="center" align="center" h="100%">
														<IconRefresh className="spin" height={20} width={20} />
													</Flex>
												),
											}}
											onClick={() => confirmAndSync(item.mode)}
											variant="filled"
											radius="xl"
											color="teal"
											size="32px"
										>
											<IconRefresh size={22} />
										</ActionIcon>
									</Group>
								</Paper>
							))}
						</Stack>
					</Tabs.Panel>

					{/* =============== import tab: pull data from the cloud server to local ================ */}
					<Tabs.Panel value="import">
						<Stack gap="md">
							{IMPORT_ITEMS.map((importItem) => (
								<Paper key={importItem.mode} p="md" radius="md" withBorder shadow="sm">
									<Group justify="space-between" wrap="nowrap">
										<Stack gap={4}>
											<Text fw={600}>{importItem.label}</Text>
											<Text size="sm" c="dimmed">
												{getLastModeRecord(importItem.mode)}
											</Text>
										</Stack>
										<ActionIcon
											loading={platformSyncing}
											loaderProps={{
												children: (
													<Flex justify="center" align="center" h="100%">
														<IconRefresh className="spin" height={20} width={20} />
													</Flex>
												),
											}}
											onClick={confirmAndSyncPlatform}
											variant="filled"
											radius="xl"
											color="blue"
											size="32px"
										>
											<IconRefresh size={22} />
										</ActionIcon>
									</Group>
								</Paper>
							))}
						</Stack>
					</Tabs.Panel>
				</Tabs>

				<Text size="xs" c="dimmed" mt="xl" ta="center">
					{lastSyncRecord?.mode && lastSyncRecord?.syncedAt
						? `Last synced ${lastSyncRecord.mode} data at: ${formatDateTime(new Date(lastSyncRecord.syncedAt))}`
						: "No sync record available yet"}
				</Text>
			</GlobalDrawer>
		</>
	);
}
