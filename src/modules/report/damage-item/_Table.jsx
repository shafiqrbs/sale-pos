import React, { useState } from "react";
import { Box, Grid, Text, Flex } from "@mantine/core";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import { useTranslation } from "react-i18next";
import KeywordSearch from "@components/KeywordSearch";
import { useForm } from "@mantine/form";
import { formatCurrency } from "@utils/index";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { useGetDamageItemQuery } from "@services/report";
import PageBreadcrumb from "@components/layout/PageBreadcrumb";

const PER_PAGE = 50;

export default function Table() {
	const { t } = useTranslation();
	const [page, setPage] = useState(1);
	const { mainAreaHeight } = useMainAreaHeight();

	// =============== when offline, always use offline data (online segment disabled) ===============

	const form = useForm({
		initialValues: {
			term: "",
			start_date: "",
			end_date: "",
		},
	});

	const { data: entities, isLoading } = useGetDamageItemQuery({
		term: form.values.term,
		start_date: form.values.start_date,
		end_date: form.values.end_date,
		page,
		offset: PER_PAGE,
	});
	return (
		<Box>
			<Flex mb="xs" gap="sm" justify="space-between" align="center">
				<PageBreadcrumb label={t("Damages")} />
				<KeywordSearch reportName={"Damage"} showStartEndDate form={form} w={"100%"} />
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
									width: 80,
									textAlign: "center",
									render: (_, index) => index + 1,
								},
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
									accessor: "item_name",
									title: t("Name"),
									render: (item) => <Text size="xs">{item?.item_name || "N/A"}</Text>,
								},

								{
									accessor: "category_name",
									title: t("Category"),
									render: (item) => <Text size="xs">{item?.category_name || "N/A"}</Text>,
								},

								{
									accessor: "warehouse_name",
									title: t("Store"),
									render: (item) => <Text size="xs">{item?.warehouse_name || "N/A"}</Text>,
								},

								{
									accessor: "quantity",
									title: t("Quantity"),
									textAlign: "center",
									render: (item) => <>{item?.quantity}</>,
								},
								{
									accessor: "unit_name",
									title: t("Unit"),
									textAlign: "right",
									render: (item) => <>{item?.unit_name}</>,
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
									render: (item) => <>{formatCurrency(item?.quantity * item?.price || 0)}</>,
								},
							]}
							fetching={isLoading}
							totalRecords={entities?.count || 0}
							recordsPerPage={PER_PAGE}
							loaderSize="xs"
							loaderColor="grape"
							page={page}
							onPageChange={(p) => {
								setPage(p);
							}}
							height={mainAreaHeight - 36}
							scrollAreaProps={{ type: "never" }}
						/>
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
