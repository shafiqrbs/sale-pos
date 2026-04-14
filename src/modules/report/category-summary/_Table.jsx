import { useState } from "react";
import { Box, Grid, Text, Flex } from "@mantine/core";
import { useNavigate, useOutletContext } from "react-router";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import KeywordSearch from "@components/KeywordSearch";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useGetCategorySummaryQuery } from "@services/report";
import { formatCurrency } from "@utils/index";
import PageBreadcrumb from "@components/layout/PageBreadcrumb";

const PER_PAGE = 2500;

const EMPTY_TOTALS = {
	opening_balance: 0,
	purchase: 0,
	sales_return: 0,
	receive_amount: 0,
	sales: 0,
	purchase_return: 0,
	damage: 0,
	issue_amount: 0,
	closing_balance: 0,
};

export default function Table() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const [opened, { open, close }] = useDisclosure(false);
	const [page, setPage] = useState(1);
	const { mainAreaHeight, isOnline } = useOutletContext();

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

	// Fix 1: Use correct field names matching actual API response
	const totals = entities?.data?.entities?.reduce(
		(acc, row) => {
			acc.opening_balance  += row.opening_balance  || 0;
			acc.purchase         += row.purchase         || 0;
			acc.sales_return     += row.sales_return     || 0;
			acc.receive_amount   += row.receive_amount   || 0;
			acc.sales            += row.sales            || 0;
			acc.purchase_return  += row.purchase_return  || 0;
			acc.damage           += row.damage           || 0;
			acc.issue_amount     += row.issue_amount     || 0;
			acc.closing_balance  += row.closing_balance  || 0;
			return acc;
		},
		{ ...EMPTY_TOTALS }
	) ?? { ...EMPTY_TOTALS };

	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<PageBreadcrumb label={t("CategorySummary")} />
				<KeywordSearch
					showKeywordSearch={false}
					reportName={"Damage"}
					showStartEndDate
					form={form}
					w={"100%"}
				/>
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
							// Fix 2: Footers are defined per-column, not at the table level
							columns={[
								{
									accessor: "index",
									title: "S/N",
									width: 80,
									textAlign: "center",
									render: (_, index) => index + 1,
									footer: <Text fw={700}>{t("Total")}</Text>,
								},
								{
									accessor: "name",
									title: t("Name"),
									render: (item) => (
										<Text size="xs">{item?.name || "N/A"}</Text>
									),
									footer: "",
								},
								{
									accessor: "opening_balance",
									title: t("Opening"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.opening_balance || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.opening_balance)}
										</Text>
									),
								},
								{
									accessor: "purchase",
									title: t("Purchase"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.purchase || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.purchase)}
										</Text>
									),
								},
								{
									accessor: "sales_return",
									title: t("SalesReturn"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.sales_return || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.sales_return)}
										</Text>
									),
								},
								{
									accessor: "receive_amount",
									title: t("Receive"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.receive_amount || 0)}</>
									),
									cellsClassName: tableCss.receiveBackground,
									footerClassName: tableCss.receiveBackground,
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.receive_amount)}
										</Text>
									),
								},
								{
									accessor: "sales",
									title: t("Sales"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.sales || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.sales)}
										</Text>
									),
								},
								{
									accessor: "purchase_return",
									title: t("PurchaseReturn"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.purchase_return || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.purchase_return)}
										</Text>
									),
								},
								{
									accessor: "damage",
									title: t("Damage"),
									textAlign: "right",
									render: (item) => (
										<>{formatCurrency(item?.damage || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.damage)}
										</Text>
									),
								},
								{
									accessor: "issue_amount",
									title: t("Issue"),
									textAlign: "right",
									cellsClassName: tableCss.issueBackground,
									footerClassName: tableCss.issueBackground,
									render: (item) => (
										<>{formatCurrency(item?.issue_amount || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right">
											{formatCurrency(totals.issue_amount)}
										</Text>
									),
								},
								{
									accessor: "closing_balance",
									title: t("Closing"),
									textAlign: "right",
									cellsClassName: tableCss.balanceBackground,
									footerClassName: tableCss.balanceBackground,
									render: (item) => (
										<>{formatCurrency(item?.closing_balance || 0)}</>
									),
									footer: (
										<Text fw={700} ta="right" c="green">
											{formatCurrency(totals.closing_balance)}
										</Text>
									),
								},
							]}
							fetching={isLoading}
							loaderSize="xs"
							loaderColor="grape"
							height={mainAreaHeight - 36}
							scrollAreaProps={{ type: "never" }}
						/>
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
