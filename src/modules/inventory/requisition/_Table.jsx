import { Text, ActionIcon, Group, Menu, Button, Badge } from "@mantine/core";
import { IconCopy, IconDotsVertical, IconEdit, IconEye, IconTrashX } from "@tabler/icons-react";
import InventoryTable from "../common/InventoryTable";
import Details from "./__Details";
import { useApproveRequisitionMutation, useGetRequisitionQuery } from "@services/requisition";
import { useCopyPurchaseMutation } from "@services/purchase";
import { APP_NAVLINKS } from "@/routes/routes";

// Statuses that prevent editing/deleting a requisition
const RESTRICTED_STATUSES = ["generated", "approved"];

const requisitionConfig = {
	// BUG FIX: original used "purchase" for deletes — now correctly uses "requisition"
	moduleName: "requisition",

	useData: ({ params }) => {
		const { data: entities, isLoading } = useGetRequisitionQuery({ params });
		return { data: entities?.data ?? [], total: entities?.total ?? 0, isLoading };
	},

	useMutations: () => {
		const [approveRequisition] = useApproveRequisitionMutation();
		const [copyPurchase] = useCopyPurchaseMutation();
		return { approve: approveRequisition, copy: copyPurchase };
	},

	getColumns: ({ t, formatCurrency, handlers, navigate }) => [
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
				const colorMap = { Created: "blue", Approved: "red" };
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
								{!isRestricted && (
									<Menu.Item
										onClick={(e) => { e.stopPropagation(); navigate(`${APP_NAVLINKS.REQUISITION_EDIT}/${data.id}`); }}
										leftSection={<IconEdit height="18" width="18" stroke={1.5} />}
										color="yellow"
									>
										{t("Edit")}
									</Menu.Item>
								)}
								<Menu.Item
									color="indigo"
									onClick={() => handlers.copy(data.id)}
									leftSection={<IconCopy height="18" width="18" stroke={1.5} />}
								>
									{t("Copy")}
								</Menu.Item>
								{!isRestricted && (
									<Menu.Item
										onClick={(e) => { e.stopPropagation(); handlers.deleteRecord(data); }}
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
	],

	newButtonLabel: "NewRequisitionN",
	onNewClick: ({ navigate }) => navigate(APP_NAVLINKS.REQUISITION_NEW),
	showDataSourceToggle: false,
	modalSize: "80%",
	getModalTitle: ({ t, viewData }) => `${t("Requisition No")}: ${viewData?.invoice || ""}`,
	renderDetails: ({ loading, viewData }) => <Details loading={loading} viewData={viewData} />,
};

export default function Table() {
	return <InventoryTable config={requisitionConfig} />;
}
