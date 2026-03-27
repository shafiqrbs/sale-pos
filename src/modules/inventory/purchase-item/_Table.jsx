import { useState } from "react";
import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button, Badge, SegmentedControl } from "@mantine/core";
import { IconCopy, IconDotsVertical, IconEdit, IconEye, IconPlus, IconTrashX } from "@tabler/icons-react";
import { useNavigate, useOutletContext } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
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
import { modals } from "@mantine/modals";
import { showNotification } from "@components/ShowNotificationComponent";
import { formatCurrency } from "@utils/index";
import {useGetPurchaseItemQuery} from "@services/purchase-item";

const PER_PAGE = 25;

export default function Table() {
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
	// =============== when offline, always use offline data (online segment disabled) ===============

	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const { data: purchaseData, isLoading } = useGetPurchaseItemQuery({
		term: form.values.term,
		start_date: form.values.start_date,
		end_date: form.values.end_date,
		page,
		offset: PER_PAGE,
	});

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<KeywordSearch showStartEndDate form={form} />
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
							records={(purchaseData?.data ?? []).filter((item) => !deletedPurchaseIds.has(item.id))}
							columns={[
								{
									accessor: "created",
									title: t("Created"),
									render: (item) => (
										<Text component="a" size="xs" variant="subtle">
											{item?.created}
										</Text>
									),
								},
								{
									accessor: "invoice",
									title: t("Invoice"),
									render: (item) => <Text size="xs">{item?.invoice || "N/A"}</Text>,
								},
								{
									accessor: "category_name",
									title: t("Category"),
									render: (item) => <Text size="xs">{item?.category_name || "N/A"}</Text>,
								},
								{
									accessor: "item_name",
									title: t("Product"),
									render: (item) => <Text size="xs">{item?.item_name || "N/A"}</Text>,
								},

								{
									accessor: "unit_name",
									title: t("Unit"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.unit_name || "0"}</Text>,
								},
								{
									accessor: "opening_quantity",
									title: t("Opening"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.opening_quantity || 0}</Text>,
								},
								{
									accessor: "quantity",
									title: t("Quantity"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.quantity || 0}</Text>,
								},
								{
									accessor: "sales_quantity",
									title: t("Sale"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.sales_quantity || 0}</Text>,
								},
								{
									accessor: "sales_return_quantity",
									title: t("Sale.Return"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.sales_return_quantity || 0}</Text>,
								},
								{
									accessor: "purchase_return_quantity",
									title: t("Purchase.Return"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.purchase_return_quantity || 0}</Text>,
								},
								{
									accessor: "damage_quantity",
									title: t("Damage"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.damage_quantity || 0}</Text>,
								},
								{
									accessor: "bonus_quantity",
									title: t("Bonus"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.bonus_quantity || 0}</Text>,
								},
								{
									accessor: "remaining_quantity",
									title: t("Remaining"),
									textAlign: "right",
									render: (item) => <Text size="xs">{item?.remaining_quantity || 0}</Text>,
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
							height={mainAreaHeight - 48}
							scrollAreaProps={{ type: "never" }}
						/>
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
