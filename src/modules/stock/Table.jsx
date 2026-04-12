import { useState, useEffect } from "react";
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
	IconEdit,
} from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import tableCss from "@assets/css/Table.module.css";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import useLocalProductList from "@hooks/useLocalProductList.js";
import useSyncProducts from "@hooks/useSyncProducts.js";
import useConfigData from "@hooks/useConfigData.js";
import { formatCurrency } from "@utils/index.js";
import KeywordSearch from "@components/KeywordSearch";
import { useNavigate, useOutletContext } from "react-router";
import { APP_NAVLINKS } from "@/routes/routes";
import AddProductDrawer from "@components/drawers/AddProductDrawer.jsx";
import useLoggedInUser from "@hooks/useLoggedInUser.js";
import { useGetProductQuery } from "@services/product";
import { useLazyGetItemsForDamageQuery } from "@services/purchase";
import DamageProcessModal from "@components/modals/DamageProcessModal";

const PER_PAGE = 25;

export default function Table() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { isOnline } = useOutletContext();
	const { isOnlinePermissionIncludes } = useLoggedInUser();
	const { mainAreaHeight } = useMainAreaHeight();
	const { currencySymbol } = useConfigData();
	const [ page, setPage ] = useState(1);
	const [ userChoice, setUserChoice ] = useState(null);
	const [ onlineSearchTerm, setOnlineSearchTerm ] = useState("");
	const [ offlineSearchTerm, setOfflineSearchTerm ] = useState("");

	const effectiveDataSource = isOnline && isOnlinePermissionIncludes ? (userChoice ?? "online") : "offline";

	const [ productDrawer, { open: openProductDrawer, close: closeProductDrawer } ] =
		useDisclosure(false);

	// =============== damage process ================
	const [ damageOpened, { open: openDamage, close: closeDamage } ] = useDisclosure(false);
	const [ selectedProduct, setSelectedProduct ] = useState(null);
	const [ triggerGetItemsForDamage, { data: damageResponse, isFetching: isDamageLoading } ] =
		useLazyGetItemsForDamageQuery();

	const handleDamage = async (record) => {
		setSelectedProduct(record);
		triggerGetItemsForDamage(record.id);
		openDamage();
	};

	const searchForm = useForm({
		initialValues: { term: "" },
	});

	// =============== declarative local product list — auto-fetches on param change ================
	const offlineTerm = offlineSearchTerm.trim();
	const offlineSearchConditions = offlineTerm ? { like: { display_name: offlineTerm } } : undefined;

	const {
		products,
		totalCount,
		loading,
		refetch: refetchLocal,
	} = useLocalProductList({
		queryOptions: {
			limit: PER_PAGE,
			offset: (page - 1) * PER_PAGE,
			orderBy: "id ASC",
			...(offlineSearchConditions && { search: offlineSearchConditions }),
		},
		enabled: effectiveDataSource === "offline",
	});

	const { syncOnlineProductsToLocal, isSyncing } = useSyncProducts();

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

	// =============== listen for product updates from sales and refetch local products ================
	useEffect(() => {
		window.addEventListener("products-updated", refetchLocal);

		return () => {
			window.removeEventListener("products-updated", refetchLocal);
		};
	}, [ refetchLocal ]);

	// =============== search handler ================
	const handleSearch = (data) => {
		const term = data?.term || "";
		setOfflineSearchTerm(term);
		setOnlineSearchTerm(term);
		setPage(1);
	};

	// =============== reset handler ================
	const handleReset = () => {
		setOfflineSearchTerm("");
		setOnlineSearchTerm("");
		setPage(1);
	};

	// =============== refresh button handler ================
	const handleRefresh = async () => {
		await syncOnlineProductsToLocal({
			type: "product",
			product_nature: "allstocks",
			term: "",
		});
		refetchOnlineProducts();
		refetchLocal();
	};

	const handleEdit = (record) => {
		if (!record?.product_id) return;
		navigate(`${APP_NAVLINKS.STOCK_EDIT}/${record.product_id}`);
	};

	// =============== derive active table data based on current data source ================
	const tableRecords =
		effectiveDataSource === "online" ? (onlineProductsResponse?.data ?? []) : products;

	const tableTotalCount =
		effectiveDataSource === "online" ? (onlineProductsResponse?.total ?? 0) : totalCount;

	const isTableLoading =
		effectiveDataSource === "online"
			? isOnlineLoading || isOnlineFetching || isSyncing
			: loading || isSyncing;

	const height = mainAreaHeight - 56;

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
								setUserChoice(value);
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
					{isOnline && isOnlinePermissionIncludes && (
						<Button
							w={170}
							size="sm"
							color="red"
							variant="filled"
							leftSection={<IconPlus size={20} />}
							id="stock-new-product-btn"
							onClick={openProductDrawer}
						>
							{t("NewProduct")}
						</Button>
					)}
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
													{!record.vendor_id && (
														<Menu.Dropdown w="160">
															<Menu.Item
																onClick={(event) => {
																	event.stopPropagation();
																	handleEdit(record);
																}}
																leftSection={<IconEdit height={"18"} width={"18"} stroke={1.5} />}
																color="yellow"
															>
																{t("Edit")}
															</Menu.Item>
															{record.quantity > 0 && (
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
															)}
														</Menu.Dropdown>
													)}
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
			<AddProductDrawer
				productDrawer={productDrawer}
				closeProductDrawer={closeProductDrawer}
				setStockProductRestore={(val) => val && refetchLocal()}
				focusField="stock-new-product-btn"
				fieldPrefix="stock_"
			/>
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
