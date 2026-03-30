import { Text, ActionIcon, Group, Menu, Button, Badge } from "@mantine/core";
import { IconCopy, IconDotsVertical, IconEdit, IconEye, IconTrashX } from "@tabler/icons-react";
import InventoryTable from "../common/InventoryTable";
import Details from "./__Details";
import usePurchaseList from "@hooks/usePurchaseList";
import { useApprovePurchaseMutation, useCopyPurchaseMutation } from "@services/purchase";
import { APP_NAVLINKS } from "@/routes/routes";

const purchaseConfig = {
	moduleName: "purchase",

	useData: ({ params, effectiveDataSource }) => {
		const { purchases, isLoading } = usePurchaseList({
			params,
			offlineFetch: effectiveDataSource === "offline",
		});
		return { data: purchases?.data ?? [], total: purchases?.total ?? 0, isLoading };
	},

	useMutations: () => {
		const [approvePurchase] = useApprovePurchaseMutation();
		const [copyPurchase] = useCopyPurchaseMutation();
		return { approve: approvePurchase, copy: copyPurchase };
	},

	getColumns: ({ t, formatCurrency, handlers, navigate }) => [
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
			title: t("Due"),
			textAlign: "right",
			render: (data) => <>{formatCurrency(Number(data.total) - Number(data.payment))}</>,
		},
		{
			accessor: "mode",
			title: t("Mode"),
		},
		{
			accessor: "process",
			title: t("Status"),
			width: "130px",
			render: (item) => {
				const colorMap = { Created: "blue", Approved: "red" };
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
							fw="100"
							fz="12"
							color="var(--theme-secondary-color-8)"
							mr="4"
							onClick={(e) => {
								e.stopPropagation();
								handlers.approve(data.id);
							}}
						>
							{t("Approve")}
						</Button>
					)}
					<Menu position="bottom-end" offset={3} withArrow trigger="hover" openDelay={100} closeDelay={400}>
						<Menu.Target>
							<ActionIcon size="sm" variant="transparent" color="red" radius="xl" aria-label="Settings">
								<IconDotsVertical height="18" width="18" stroke={1.5} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown w="200">
							<Menu.Item
								onClick={(e) => { e.stopPropagation(); handlers.showDetails(data); }}
								leftSection={<IconEye height="18" width="18" stroke={1.5} />}
								color="blue"
							>
								{t("Show")}
							</Menu.Item>
							<Menu.Item
								onClick={(e) => { e.stopPropagation(); navigate(`${APP_NAVLINKS.PURCHASE_EDIT}/${data.id}`); }}
								leftSection={<IconEdit height="18" width="18" stroke={1.5} />}
								color="yellow"
							>
								{t("Edit")}
							</Menu.Item>
							<Menu.Item
								color="indigo"
								onClick={() => handlers.copy(data.id)}
								leftSection={<IconCopy height="18" width="18" stroke={1.5} />}
							>
								{t("Copy")}
							</Menu.Item>
							<Menu.Item
								onClick={(e) => { e.stopPropagation(); handlers.deleteRecord(data); }}
								color="red"
								leftSection={<IconTrashX height="18" width="18" stroke={1.5} />}
							>
								{t("Delete")}
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Group>
			),
		},
	],

	newButtonLabel: "NewPurchase",
	onNewClick: ({ navigate }) => navigate(APP_NAVLINKS.PURCHASE_NEW),
	showDataSourceToggle: true,
	selectedRowStyle: { background: "var(--theme-primary-color-3)", color: "#ffffff" },
	modalSize: "80%",
	getModalTitle: ({ t, viewData }) => `${t("Purchase")}: ${viewData?.invoice || ""}`,
	renderDetails: ({ loading, viewData }) => <Details loading={loading} viewData={viewData} />,
};

export default function Table() {
	return <InventoryTable config={purchaseConfig} />;
}
