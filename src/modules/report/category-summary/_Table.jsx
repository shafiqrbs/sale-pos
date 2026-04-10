import React, { useState } from "react";
import { Box, Grid, Text, ActionIcon, Group, Menu, Flex, Button, Badge, SegmentedControl } from "@mantine/core";
import { useNavigate, useOutletContext } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import KeywordSearch from "@components/KeywordSearch";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import {useGetCategorySummaryQuery} from "@services/report";
import {formatCurrency} from "@utils/index";
import {IconPlus} from "@tabler/icons-react";
import {APP_NAVLINKS} from "@/routes/routes";
import PageBreadcrumb from "@components/layout/PageBreadcrumb";



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

	const { data: entities, isLoading } = useGetCategorySummaryQuery({
		term: form.values.term,
		start_date: form.values.start_date,
		end_date: form.values.end_date,
	});

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<PageBreadcrumb label={t("CategorySummary")} />
				<KeywordSearch showKeywordSearch={false} reportName={"Damage"} showStartEndDate form={form} w={"100%"} />
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
									accessor: "opening_balance",
									title: t("Opening"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.opening_balance || 0)}</>,
								},
								{
									accessor: "purchase",
									title: t("Purchase"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.purchase || 0)}</>,
								},
								{
									accessor: "sales_return",
									title: t("SalesReturn"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.sales_return || 0)}</>,
								},
								{
									accessor: "receive_amount",
									title: t("Receive"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.receive_amount || 0)}</>,
									cellsClassName: tableCss.receiveBackground,
								},

								{
									accessor: "sales",
									title: t("Sales"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.sales || 0)}</>,
								},

								{
									accessor: "purchase_return",
									title: t("PurchaseReturn"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.purchase_return || 0)}</>,
								},

								{
									accessor: "damage",
									title: t("Damage"),
									textAlign: "right",
									render: (item) => <>{formatCurrency(item?.damage || 0)}</>,
								},

								{
									accessor: "issue_amount",
									title: t("Issue"),
									textAlign: "right",
									cellsClassName: tableCss.issueBackground,
									render: (item) => <>{formatCurrency(item?.issue_amount || 0)}</>,
								},

								{
									accessor: "closing_balance",
									title: t("Closing"),
									textAlign: "right",
									cellsClassName: tableCss.balanceBackground,
									render: (item) => <>{formatCurrency(item?.closing_balance || 0)}</>,
								},

							]}
							fetching={isLoading}
							loaderSize="xs"
							loaderColor="grape"
							height={mainAreaHeight-36}
							scrollAreaProps={{ type: "never" }}
						/>
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
