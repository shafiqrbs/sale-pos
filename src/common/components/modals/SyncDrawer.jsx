import { Divider, Stack, Paper, Group, Text, ActionIcon, rem } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { SYNC_DATA } from "@/constants";
import { showNotification } from "@components/ShowNotificationComponent";
import { useSyncPosMutation } from "@services/pos";
import GlobalDrawer from "./GlobalDrawer";

export default function SyncDrawer({ configData, syncPanelOpen, setSyncPanelOpen }) {
	const [ syncPos ] = useSyncPosMutation();

	const buildSalesPayload = ({ salesData }) => {
		console.log(salesData)
		// return;
		return {
			device_id: configData?.deviceId ?? "123",
			sync_batch_id: new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-001",

			content: salesData.map((sale) => ({
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
	};


	const handleSync = async (syncOption) => {
		try {
			switch (syncOption) {
				case "sales": {
					const salesData = await window.dbAPI.getDataFromTable("sales");

					const response = await syncPos(buildSalesPayload({ salesData })).unwrap();

					if (response?.status === "error") {
						showNotification(
							response.payload?.message || "Error syncing sales data",
							"red",
							"",
							"",
							true
						);
					} else {
						showNotification(
							response.payload?.message || "Sales data synced successfully",
							"teal",
							"lightgray",
							"",
							"",
							true
						);

						window.dbAPI.destroyTableData("sales");
					}
					break;
				}

				default:
					break;
			}
		} catch (error) {
			console.error("Error syncing sales data:", error);
		}
	};

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
									{item.description}
								</Text>
							</Stack>
							<ActionIcon
								onClick={() => handleSync(item.mode)}
								variant="filled"
								radius="xl"
								color="teal"
								size="28px"
								className="sync-button"
							>
								<IconRefresh className="sync-icon" size={20} />
							</ActionIcon>
						</Group>
					</Paper>
				))}
			</Stack>

			<Text size="xs" c="dimmed" mt="xl" ta="center">
				Last synchronized: Today at {new Date().toLocaleTimeString()}
			</Text>
		</GlobalDrawer>
	);
}
