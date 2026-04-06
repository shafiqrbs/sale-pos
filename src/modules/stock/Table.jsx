import { useState, useCallback, useEffect, useRef } from "react";
import {
	Box,
	Flex,
	ActionIcon,
	SegmentedControl,
	Button,
	Group,
	Tooltip,
	Menu,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { useForm } from "@mantine/form";
import {
	IconPlus,
	IconDotsVertical,
	IconTruckReturn,
	IconGlobe,
	IconGlobeOff,
	IconCloudDown,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import useLocalProducts from "@hooks/useLocalProducts.js";
import useConfigData from "@hooks/useConfigData.js";
import { formatCurrency } from "@utils/index.js";
import KeywordSearch from "@components/KeywordSearch";
import { APP_NAVLINKS } from "@/routes/routes";
import { useNavigate, useOutletContext } from "react-router";
import useLoggedInUser from "@hooks/useLoggedInUser.js";
import { useGetProductQuery } from "@services/product";
import { useLazyGetItemsForDamageQuery } from "@services/purchase";
import DamageProcessModal from "@components/modals/DamageProcessModal";

const PER_PAGE = 25;

export default function Table() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { isOnline } = useOutletContext();
	const { isOnlinePermissionIncludes } = useLoggedInUser();
	const { mainAreaHeight } = useMainAreaHeight();
	const { currencySymbol } = useConfigData();
	const [page, setPage] = useState(1);
	const [dataSource, setDataSource] = useState("offline");
	const [onlineSearchTerm, setOnlineSearchTerm] = useState("");
	const searchRef = useRef({ term: "" });

	const effectiveDataSource = isOnline && isOnlinePermissionIncludes ? dataSource : "offline";

	// =============== damage process ================
	const [damageOpened, { open: openDamage, close: closeDamage }] = useDisclosure(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [triggerGetItemsForDamage, { data: damageResponse, isFetching: isDamageLoading }] =
		useLazyGetItemsForDamageQuery();

	const handleDamage = async (record) => {
		setSelectedProduct(record);
		triggerGetItemsForDamage(record.id);
		openDamage();
	};

	const searchForm = useForm({
		initialValues: { term: "" },
	});

	const {
		products,
		totalCount,
		getLocalProducts,
		getProductCount,
		syncOnlineProductsToLocal,
		loading,
		isSyncing,
	} = useLocalProducts({
		fetchOnMount: false,
	});

	// =============== online stock products via RTK Query ================
	const {
		data: onlineProductsResponse,
		isLoading: isOnlineLoading,
		isFetching: isOnlineFetching,
		refetch: refetchOnlineProducts,
	} = useGetProductQuery(
		{
			term: onlineSearchTerm,
			page,
			offset: PER_PAGE,
			type: "product",
			product_nature: "allstocks",
		},
		{ skip: effectiveDataSource !== "online" }
	);

	// =============== fetch local products with pagination and search ================
	const fetchLocalProductsPage = useCallback(async () => {
		const offset = (page - 1) * PER_PAGE;
		const term = searchRef.current.term?.trim() || "";

		const searchConditions = term
			? {
					like: {
						display_name: term,
					},
				}
			: undefined;

		await getLocalProducts({}, "id", {
			limit: PER_PAGE,
			offset,
			orderBy: "id ASC",
			...(searchConditions && { search: searchConditions }),
		});

		await getProductCount(
			{},
			{
				...(searchConditions && { search: searchConditions }),
			}
		);
	}, [page, getLocalProducts, getProductCount]);

	// =============== fetch local products on mount and when page or data source changes ================
	useEffect(() => {
		if (effectiveDataSource === "offline") {
			fetchLocalProductsPage();
		}
	}, [fetchLocalProductsPage, effectiveDataSource]);

	// =============== listen for product updates from sales and refetch local products ================
	useEffect(() => {
		window.addEventListener("products-updated", fetchLocalProductsPage);

		return () => {
			window.removeEventListener("products-updated", fetchLocalProductsPage);
		};
	}, [fetchLocalProductsPage]);

	// =============== search handler ================
	const handleSearch = (data) => {
		const term = data?.term || "";
		searchRef.current.term = term;
		setOnlineSearchTerm(term);
		setPage(1);
		fetchLocalProductsPage();
	};

	// =============== reset handler ================
	const handleReset = () => {
		searchRef.current.term = "";
		setOnlineSearchTerm("");
		setPage(1);
		fetchLocalProductsPage();
	};

	// =============== refresh button handler ================
	const handleRefresh = async () => {
		await syncOnlineProductsToLocal({
			type: "product",
			product_nature: "allstocks",
			term: "",
		});
		refetchOnlineProducts();
		fetchLocalProductsPage();
	};

	// =============== derive active table data based on current data source ================
	const tableRecords =
		effectiveDataSource === "online" ? (onlineProductsResponse?.data ?? []) : products;

	const tableTotalCount =
		effectiveDataSource === "online" ? (onlineProductsResponse?.total ?? 0) : totalCount;

	const isTableLoading =
		effectiveDataSource === "online" ? isOnlineLoading || isOnlineFetching || isSyncing : loading;

	const height = mainAreaHeight - 60;

	return (
		<Box>
			<Flex gap="sm" mb="2xs" justify="space-between" align="center">
				<KeywordSearch
					form={searchForm}
					onSearch={handleSearch}
					onReset={handleReset}
					placeholder={t("SearchByProductNameOrBarcode")}
					showDatePicker={false}
					showAdvancedFilter={false}
				/>
				<Group gap="sm" wrap="nowrap">
					{isOnline && isOnlinePermissionIncludes && (
						<SegmentedControl
							value={effectiveDataSource}
							onChange={(value) => {
								setDataSource(value);
								setPage(1);
							}}
							color={effectiveDataSource === "online" ? "green" : "red"}
							data={[
								{
									value: "online",
									label: (
										<Group gap={4} wrap="nowrap">
											<IconGlobe
												size={13}
												color={
													effectiveDataSource === "online"
														? "white"
														: "var(--mantine-color-green-6)"
												}
											/>
											{t("Online")}
										</Group>
									),
								},
								{
									value: "offline",
									label: (
										<Group gap={4} wrap="nowrap">
											<IconGlobeOff
												size={13}
												color={
													effectiveDataSource === "offline" ? "white" : "var(--mantine-color-red-6)"
												}
											/>
											{t("Offline")}
										</Group>
									),
								},
							]}
						/>
					)}
					<Tooltip
						label="Click here for update stock"
						c="white"
						bg="green"
						withArrow
						zIndex={999}
						transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
					>
						<ActionIcon
							bg="var(--theme-primary-color-4)"
							onClick={handleRefresh}
							disabled={isTableLoading || !isOnline}
							size="lg"
							aria-label="Refresh"
						>
							<IconCloudDown size={16} stroke={1.5} />
						</ActionIcon>
					</Tooltip>
					<Button
						w={170}
						size="md"
						color="red"
						variant="filled"
						leftSection={<IconPlus size={20} />}
						onClick={() => navigate(APP_NAVLINKS.SALES_NEW)}
					>
						{t("NewProduct")}
					</Button>
				</Group>
			</Flex>
			<Box className="border-all-radius border-top-none overflow-hidden">
				<DataTable
					classNames={{
						root: tableCss.root,
						table: tableCss.table,
						header: tableCss.header,
						footer: tableCss.footer,
						pagination: tableCss.pagination,
					}}
					records={tableRecords}
					columns={[
						{
							accessor: "index",
							title: t("S/N"),
							textAlignment: "right",
							width: 70,
							render: (record) => tableRecords.indexOf(record) + 1 + (page - 1) * PER_PAGE,
						},
						{
							accessor: "product_name",
							title: t("Product"),
							width: 220,
							render: (record) => record.product_name || record.display_name || "—",
						},
						{
							accessor: "barcode",
							title: t("Barcode"),
							width: 130,
							render: (record) => record.barcode || "—",
						},
						{
							accessor: "category",
							title: t("Category"),
							width: 140,
							render: (record) => record.category || record.category_name || "—",
						},
						{
							accessor: "unit_name",
							title: t("Unit"),
							width: 90,
							render: (record) => record.unit_name || "—",
						},
						{
							accessor: "quantity",
							title: t("Quantity"),
							textAlignment: "right",
							width: 100,
							render: (record) => {
								const quantity = record.quantity;
								return quantity != null && quantity !== "" ? Number(quantity) : "—";
							},
						},
						{
							accessor: "purchase_price",
							title: t("Purchase") + " " + t("Price"),
							textAlignment: "right",
							width: 120,
							render: (record) =>
								record.purchase_price != null
									? `${currencySymbol} ${formatCurrency(record.purchase_price)}`
									: "—",
						},
						{
							accessor: "sales_price",
							title: t("Sales") + " " + t("Price"),
							textAlignment: "right",
							width: 120,
							render: (record) =>
								record.sales_price != null
									? `${currencySymbol} ${formatCurrency(record.sales_price)}`
									: "—",
						},
						...(effectiveDataSource === "online"
							? [
									{
										accessor: "action",
										title: t("Action"),
										textAlign: "right",
										width: 80,
										render: (record) => {
											const quantity = Number(record.quantity);
											if (!quantity || quantity <= 0) return null;

											return (
												<Group gap={4} justify="right" wrap="nowrap">
													<Menu
														position="bottom-end"
														offset={3}
														withArrow
														trigger="hover"
														openDelay={100}
														closeDelay={400}
													>
														<Menu.Target>
															<ActionIcon
																size="sm"
																variant="transparent"
																color="red"
																radius="xl"
																aria-label="Actions"
															>
																<IconDotsVertical height={"18"} width={"18"} stroke={1.5} />
															</ActionIcon>
														</Menu.Target>
														<Menu.Dropdown w="160">
															<Menu.Item
																onClick={(event) => {
																	event.stopPropagation();
																	handleDamage(record);
																}}
																leftSection={
																	<IconTruckReturn height={"18"} width={"18"} stroke={1.5} />
																}
																color="red"
															>
																{t("Damage")}
															</Menu.Item>
														</Menu.Dropdown>
													</Menu>
												</Group>
											);
										},
									},
								]
							: []),
					]}
					fetching={isTableLoading}
					totalRecords={tableTotalCount}
					recordsPerPage={PER_PAGE}
					page={page}
					onPageChange={setPage}
					loaderSize="xs"
					loaderColor="grape"
					height={height}
					scrollAreaProps={{ type: "never" }}
				/>
			</Box>
			<DamageProcessModal
				opened={damageOpened}
				onClose={closeDamage}
				product={selectedProduct}
				damageItems={damageResponse?.data ?? []}
				loading={isDamageLoading}
				onSuccess={handleRefresh}
			/>
		</Box>
	);
}
