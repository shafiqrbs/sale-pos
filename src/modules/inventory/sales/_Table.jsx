import { Text, Flex, ActionIcon, Group, Menu } from "@mantine/core";
import { IconDotsVertical, IconEye } from "@tabler/icons-react";
import { useDispatch } from "react-redux";
import InventoryTable from "../common/InventoryTable";
import Details from "./__Details";
import useSalesList from "@hooks/useSalesList";
import useConfigData from "@hooks/useConfigData";
import { setEditingSale } from "@features/checkout";
import { APP_NAVLINKS } from "@/routes/routes";
import { showNotification } from "@components/ShowNotificationComponent";

// Sales-only: loads a completed sale back into the POS interface for editing.
// Clears existing invoice items, inserts the sale's items, dispatches Redux
// state, and navigates to the bakery POS page.
async function handleEditInPos(data, dispatch, navigate) {
	try {
		const existingItems = await window.dbAPI.getDataFromTable("invoice_table_item");
		if (existingItems?.length) {
			const ids = existingItems.map((item) => item.id);
			await window.dbAPI.deleteManyFromTable("invoice_table_item", ids);
		}

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

		dispatch(
			setEditingSale({
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
			})
		);

		navigate(APP_NAVLINKS.BAKERY);
	} catch (err) {
		console.error("Error loading sale into POS:", err);
		showNotification("Failed to load sale into POS", "red");
	}
}

const salesConfig = {
	moduleName: "sales",

	useData: ({ params, effectiveDataSource }) => {
		const { sales, isLoading } = useSalesList({
			params: { ...params, status: "completed" },
			offlineFetch: effectiveDataSource === "offline",
		});
		return { data: sales?.data ?? [], total: sales?.total ?? 0, isLoading };
	},

	// Sales uses Redux dispatch + configData for POS routing
	useExtraHooks: () => {
		const dispatch = useDispatch();
		const { configData } = useConfigData();
		return { configData, dispatch };
	},

	getColumns: ({ t, formatCurrency, handlers }) => [
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
				<Text component="a" size="sm" variant="subtle">
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
			render: (data) => <>{formatCurrency(Number(data.total) - Number(data.payment))}</>,
		},
		{
			accessor: "action",
			title: t("Action"),
			textAlign: "right",
			render: (data) => (
				<Group gap={4} justify="right" wrap="nowrap">
					<Menu position="bottom-end" offset={3} withArrow trigger="hover" openDelay={100} closeDelay={400} ta="right">
						<Menu.Target>
							<ActionIcon size="sm" variant="transparent" color="red" aria-label="Settings" onClick={(e) => e.preventDefault()}>
								<IconDotsVertical height="18" width="18" stroke={1.5} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown w="200">
							<Menu.Item
								onClick={(e) => { e.preventDefault(); handlers.showDetails(data); }}
								color="blue"
							>
								<Flex gap={4} align="center">
									<IconEye size={18} />
									<Text size="sm">{t("Show")}</Text>
								</Flex>
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Group>
			),
		},
	],

	newButtonLabel: "NewSale",
	onNewClick: ({ navigate, extraHookData }) => {
		if (extraHookData?.configData?.is_pos) {
			navigate(APP_NAVLINKS.BAKERY);
		} else {
			navigate(APP_NAVLINKS.SALES_NEW);
		}
	},
	showDataSourceToggle: true,
	selectedRowStyle: { background: "var(--theme-primary-color-3)", color: "#ffffff" },
	modalSize: "80%",
	getModalTitle: ({ t, viewData }) => `${t("Sales")}: ${viewData?.invoice || ""}`,
	// Sales Details uses different prop names than other modules
	renderDetails: ({ loading, viewData, listData }) => (
		<Details loading={loading} salesViewData={viewData} salesData={listData} />
	),
};

export default function Table() {
	return <InventoryTable config={salesConfig} />;
}
