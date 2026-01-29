import { Divider, Stack, Paper, Group, Text, ActionIcon, rem, Flex } from "@mantine/core";
import { modals } from "@mantine/modals";
import { IconRefresh } from "@tabler/icons-react";
import { SYNC_DATA } from "@/constants";
import { showNotification } from "@components/ShowNotificationComponent";
import { useSyncPosMutation } from "@services/pos";
import GlobalDrawer from "./GlobalDrawer";
import {
	formatDateTime,
	generateUniqueId,
	getLastSyncRecord,
	getLastSyncRecordByMode,
	getSyncRecordsFromLocalStorage,
	saveSyncRecordToLocalStorage,
} from "@utils/index";
import { useMemo, useState } from "react";

const TABLE_MAPPING = {
	sales: "sales",
	purchases: "purchases",
	products: "products",
	customers: "customers",
	vendors: "vendors"
};



export default function SyncDrawer({ configData, syncPanelOpen, setSyncPanelOpen }) {
	const [ syncPos ] = useSyncPosMutation();
	const [ syncRecords, setSyncRecords ] = useState(() => getSyncRecordsFromLocalStorage());
	const [ loadingStates, setLoadingStates ] = useState(() => {
		return SYNC_DATA.reduce((accumulator, item) => {
			accumulator[ item.mode ] = false;
			return accumulator;
		}, {});
	});

	const lastSyncRecord = useMemo(() => getLastSyncRecord(syncRecords), [ syncRecords ]);

	const buildSyncPayload = ({ syncType, syncData }) => {
		const basePayload = {
			device_id: configData?.deviceId ?? "123",
			sync_batch_id: generateUniqueId(),
		};

		switch (syncType) {
			case "sales":
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
						customerName:
							sale?.customerName ??
							configData?.domain?.name ??
							"",

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

						sales_items: Array.isArray(JSON.parse(sale?.sales_items || "[]"))
							? JSON.parse(sale?.sales_items || "[]")?.map((item) => ({
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

								crated_at: item?.crated_at ?? "",
								updated_at: item?.updated_at ?? ""
							}))
							: [],

						multi_transaction: sale?.multi_transaction ?? 0,

						splitPayment: Array.isArray(sale?.splitPayment)
							? sale.splitPayment.map((p) => ({
								id: p?.id ?? null,
								transaction_mode_id: p?.transaction_mode_id ?? null,
								invoice_id: p?.invoice_id ?? "",
								amount: p?.amount ?? 0,
								created_at: p?.created_at ?? "",
								updated_at: p?.updated_at ?? ""
							}))
							: []
					}))
				};

			case "purchases":
			case "products":
			case "customers":
			case "vendors":
				// =============== generic payload structure for other sync types ================
				return {
					...basePayload,
					content: syncData || []
				};

			default:
				return basePayload;
		}
	};

	const runSync = async (syncOption) => {
		setLoadingStates((previousStates) => ({
			...previousStates,
			[ syncOption ]: true,
		}));

		try {
			let tableName = syncOption;
			let syncData = null;

			tableName = TABLE_MAPPING[ syncOption ] || syncOption;
			syncData = await window.dbAPI.getDataFromTable(tableName);

			const payload = buildSyncPayload({ syncType: syncOption, syncData: syncData || [] });

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

				showNotification(
					response?.message || `${syncOption.charAt(0).toUpperCase() + syncOption.slice(1)} data synced successfully`,
					"teal",
					"lightgray",
					"",
					"",
					true
				);

				// silently destroy the table data after successful sync
				window.dbAPI.destroyTableData(tableName);
			}
		} catch (error) {
			console.error(`Error syncing ${syncOption} data:`, error);
			showNotification(
				`Failed to sync ${syncOption} data. Please try again.`,
				"red",
				"",
				"",
				true
			);
		} finally {
			setLoadingStates((previousStates) => ({
				...previousStates,
				[ syncOption ]: false,
			}));
		}
	};

	const confirmAndSync = (syncOption) => {
		modals.openConfirmModal({
			title: "Confirm sync",
			children: (
				<Text size="sm">
					Are you sure you want to sync <Text span fw={600} tt="capitalize">{syncOption}</Text> data now? Local data will be cleared after the successful sync but available in the online database.
				</Text>
			),
			labels: { confirm: "Sync now", cancel: "Cancel" },
			confirmProps: { color: "teal", leftSection: <IconRefresh size={20} /> },
			onConfirm: () => runSync(syncOption),
		});
	};

	const getLastModeRecord = (mode) => {
		const lastModeRecord = getLastSyncRecordByMode(syncRecords, mode);
		if (!lastModeRecord?.syncedAt) return "Not synced yet";
		return `Last synced: ${formatDateTime(new Date(lastModeRecord.syncedAt))}`;
	}

	return (
		<GlobalDrawer
			opened={syncPanelOpen}
			onClose={() => setSyncPanelOpen(false)}
			title="Syncing Information"
			styles={{
				title: { fontWeight: 600, fontSize: rem(20), color: "#626262" },
			}}
		>
			<Divider mb="md" />

			<Stack gap="md">
				{SYNC_DATA.map((item, index) => (
					<Paper key={index} p="md" radius="md" withBorder shadow="sm">
						<Group justify="space-between" wrap="nowrap">
							<Stack gap={4}>
								<Text fw={600} tt="capitalize">
									{item.mode}
								</Text>
								<Text size="sm" c="dimmed">
									{getLastModeRecord(item?.mode)}
								</Text>
							</Stack>
							<ActionIcon
								loading={loadingStates[ item.mode ] || false}
								loaderProps={{
									children: <Flex justify="center" align="center" h="100%">
										<IconRefresh className="spin" height={20} width={20} />
									</Flex>
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

			<Text size="xs" c="dimmed" mt="xl" ta="center">
				{lastSyncRecord?.mode && lastSyncRecord?.syncedAt
					? `Last synced ${lastSyncRecord.mode} data at: ${formatDateTime(new Date(lastSyncRecord.syncedAt))}`
					: "No sync record available yet"}
			</Text>
		</GlobalDrawer>
	);
}
