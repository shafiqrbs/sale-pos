import { useEffect, useState } from "react";
import { Image, ScrollArea, Box, Card, Grid, Text, Flex } from "@mantine/core";
import { useOutletContext } from "react-router";
import useConfigData from "@hooks/useConfigData";
import Categories from "./Categories";
import ProductFilters from "./ProductFilters";
import ProductTable from "./ProductTable";
import useCartOperation from "@hooks/useCartOperation";
import BatchProductModal from "@components/modals/BatchProductModal";
import { useDisclosure } from "@mantine/hooks";
import ProductPagination from "./ProductPagination";
import noProductImg from "@assets/images/not-found.webp";
import noProductImgFound from "@assets/images/no-image.png";
import { RESTRICT_PRODUCT_QUANTITY_LIMIT } from "@constants/index";

const ITEMS_PER_PAGE = 16;

export default function ProductList() {
	const [allProducts, setAllProducts] = useState([]);
	const [totalProducts, setTotalProducts] = useState(0);
	const [activePage, setActivePage] = useState(1);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [batchModalOpened, { open: openBatchModal, close: closeBatchModal }] = useDisclosure(false);
	const { increment } = useCartOperation();
	const { mainAreaHeight, isOnline } = useOutletContext();
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	const [filter, setFilter] = useState({
		categories: [],
		search: "",
		barcode: "",
		view: "grid", // grid | list | minimal
	});

	useEffect(() => {
		async function fetchProductsPage() {
			try {
				const offset = (activePage - 1) * ITEMS_PER_PAGE;

				const normalizedSearchValue = filter.search.trim();
				const normalizedBarcodeValue = filter.barcode.trim();
				const selectedCategoryIds = filter.categories;

				const searchConditions = {
					like: {
						display_name: normalizedSearchValue || undefined,
						barcode: normalizedBarcodeValue || undefined,
					},
					in: {
						category_id:
							Array.isArray(selectedCategoryIds) && selectedCategoryIds.length > 0
								? selectedCategoryIds
								: undefined,
					},
				};

				const fetchedProducts = await window.dbAPI.getDataFromTable("core_products", {}, "id", {
					limit: ITEMS_PER_PAGE,
					offset,
					search: searchConditions,
				});

				const productsCount = await window.dbAPI.getTableCount(
					"core_products",
					{},
					{
						search: searchConditions,
					}
				);

				setAllProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
				setTotalProducts(typeof productsCount === "number" ? productsCount : 0);
			} catch (error) {
				console.error("Failed to fetch paginated products from sqlite:", error);
				setAllProducts([]);
				setTotalProducts(0);
			}
		}

		fetchProductsPage();
	}, [activePage, filter.barcode, filter.categories, filter.search]);

	// =============== check if product should be disabled ================
	const isProductDisabled = (product) => {
		if (!RESTRICT_PRODUCT_QUANTITY_LIMIT) return false;

		const purchaseItems = JSON.parse(product?.purchase_item_for_sales || "[]");

		if (purchaseItems.length > 0) {
			// =============== for batch products check all remain quantities ================
			return purchaseItems.every((item) => (item.remain_quantity || 0) <= 0);
		} else {
			// =============== for non batch products check main quantity ================
			return (product.quantity || 0) <= 0;
		}
	};

	const handleProductClick = async (product) => {
		// =============== prevent clicking disabled products ================
		if (isProductDisabled(product)) {
			return;
		}

		const purchaseItems = JSON.parse(product?.purchase_item_for_sales || "[]");

		if (purchaseItems.length > 0) {
			const itemCondition = {
				stock_item_id: product.stock_item_id || product.stock_id,
			};
			const cartItems = await window.dbAPI.getDataFromTable("invoice_table_item", itemCondition);

			let currentBatches = [];
			if (cartItems && cartItems.length > 0) {
				try {
					currentBatches =
						typeof cartItems[0].batches === "string"
							? JSON.parse(cartItems[0].batches)
							: Array.isArray(cartItems[0].batches)
								? cartItems[0].batches
								: [];
				} catch {
					currentBatches = [];
				}
			}

			setSelectedProduct({ ...product, currentBatches });
			openBatchModal();
		} else {
			increment(product);
		}
	};

	// =============== handle batch selection ================
	const handleBatchSelect = (selectedBatches) => {
		if (selectedProduct) {
			const isUpdate = selectedProduct.currentBatches && selectedProduct.currentBatches.length > 0;
			increment(selectedProduct, selectedBatches, isUpdate);
			setSelectedProduct(null);
		}
	};

	return (
		<Box bg="white" w="100%" className="border-radius">
			<Grid columns={12} gutter="4xs" pl="3xs" pb="3xs">
				<Grid.Col span={3}>
					<Categories filter={filter} setFilter={setFilter} />
				</Grid.Col>
				<Grid.Col span={9} pos="relative">
					<Box bg="gray.8" px="les" pt="es" pb="les" mb="les" bdrs={6}>
						<ProductFilters filter={filter} setFilter={setFilter} />
					</Box>
					<Box bg="gray.8" p="4xs" bdrs={6}>
						<ScrollArea h={mainAreaHeight - 60} type="never" scrollbars="y">
							<Grid columns={12} gutter="4xs" mb={58}>
								{filter.view !== "minimal" ? (
									<>
										{allProducts.length > 0 ? (
											allProducts.map((product) => {
												const productDisabled = isProductDisabled(product);
												return (
													<Grid.Col
														span={filter.view === "grid" ? 3 : filter.view === "list" ? 6 : 12}
														key={product.id}
													>
														<Card
															shadow="md"
															radius="md"
															padding="xs"
															h="100%"
															className={productDisabled ? "" : "cursor-pointer"}
															styles={() => ({
																root: {
																	transition: "transform 0.5s ease-in-out",
																	opacity: productDisabled ? 0.5 : 1,
																	cursor: productDisabled ? "not-allowed" : "pointer",
																	pointerEvents: productDisabled ? "none" : "auto",
																},
															})}
															onClick={() => handleProductClick(product)}
														>
															<Image
																radius="sm"
																h={120}
																w="auto"
																fit="cover"
																src={`${import.meta.env.VITE_IMAGE_GATEWAY_URL}/storage/${product.feature_image}`}
																fallbackSrc={noProductImgFound}
															/>
															<Text fw={600} size="sm" fz="13" mt="4" ta="left">
																{product?.display_name}
															</Text>

															<Text
																styles={{
																	root: {
																		marginTop: "auto",
																	},
																}}
																ta="right"
																fw={900}
																fz="18"
																size="md"
																c="green.9"
															>
																{configData?.currency?.symbol ||
																	configData?.inventory_config?.currency?.symbol}{" "}
																{product?.sales_price?.toFixed(2)}
															</Text>
														</Card>
													</Grid.Col>
												);
											})
										) : (
											<Flex
												bdrs="4px"
												className="overflow-hidden"
												w="100%"
												align="center"
												justify="center"
												bg="#ECF0F3"
												h={mainAreaHeight - 58}
											>
												<Image src={noProductImg} w="100%" h="100%" fit="contain" />
											</Flex>
										)}
									</>
								) : (
									<Box w="100%">
										<ProductTable products={allProducts || []} />
									</Box>
								)}
							</Grid>
						</ScrollArea>
					</Box>
					<ProductPagination
						activePage={activePage}
						totalItems={totalProducts}
						itemsPerPage={ITEMS_PER_PAGE}
						onPageChange={setActivePage}
					/>
				</Grid.Col>
			</Grid>

			<BatchProductModal
				opened={batchModalOpened}
				close={closeBatchModal}
				purchaseItems={JSON.parse(selectedProduct?.purchase_item_for_sales || "[]")}
				currentBatches={selectedProduct?.currentBatches || []}
				productName={selectedProduct?.display_name}
				onBatchSelect={handleBatchSelect}
			/>
		</Box>
	);
}
