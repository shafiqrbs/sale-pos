import { useState } from "react";
import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button, Badge, SegmentedControl } from "@mantine/core";
import { useNavigate, useOutletContext } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import KeywordSearch from "@components/KeywordSearch";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {useGetDamageItemQuery} from "@services/report";
import {formatCurrency} from "@utils/index";
import {IconPlus} from "@tabler/icons-react";
import {APP_NAVLINKS} from "@/routes/routes";



const PER_PAGE = 2500;

export default function Table() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [opened, { open, close }] = useDisclosure(false);
	const [page, setPage] = useState(1);
	const [deletedPurchaseIds, setDeletedPurchaseIds] = useState(new Set());
	const { mainAreaHeight, isOnline } = useOutletContext();

	// =============== when offline, always use offline data (online segment disabled) ===============

	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const { data: entities, isLoading } = useGetDamageItemQuery({
		page,
		offset: PER_PAGE,
	});

	console.log(entities?.data?.entities);

	return (
		<Box>
			<Flex pl="xs" pb={'xs'} gap="sm" justify="space-between" align="center">
				<Text>{t("CategorySummaryReport")}</Text>
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
							records={entities?.data?.entities}
							columns={[
								{
									accessor: "index",
									title: "S/N",
									width:80,
									textAlign: "center",
									render: (_, index) => index + 1,
								},
								{
									accessor: "name",
									title: t("Name"),
									render: (item) => <Text size="xs">{item?.name || "N/A"}</Text>,
								},

								{
									accessor: "quantity",
									title: t("Quantity"),
									textAlign: "right",
									render: (item) => <>{item?.quantity}</>,
								},
								{
									accessor: "price",
									title: t("Price"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.price || 0)}</>,
								},
								{
									accessor: "total",
									title: t("Amount"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.total || 0)}</>,
								},

							]}
							fetching={isLoading}
							totalRecords={entities?.total || 0}
							recordsPerPage={PER_PAGE}
							loaderSize="xs"
							loaderColor="grape"
							page={page}
							onPageChange={(p) => {
								setPage(p);
							}}
							height={mainAreaHeight-36}
							scrollAreaProps={{ type: "never" }}
						/>
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
