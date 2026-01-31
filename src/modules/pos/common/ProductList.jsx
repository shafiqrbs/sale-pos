import React, { useEffect, useMemo, useState } from 'react'
import { Image, ScrollArea, Box, Card, Grid, Text, Flex } from '@mantine/core'
import { useOutletContext } from 'react-router'
import useConfigData from '@hooks/useConfigData'
import Categories from './Categories';
import ProductFilters from './ProductFilters'
import ProductTable from './ProductTable';
import useCartOperation from '@hooks/useCartOperation';
import BatchProductModal from '@components/modals/BatchProductModal';
import { useDisclosure } from '@mantine/hooks';

export default function ProductList() {
    const [ allProducts, setAllProducts ] = useState([])
    const [ selectedProduct, setSelectedProduct ] = useState(null);
    const [ batchModalOpened, { open: openBatchModal, close: closeBatchModal } ] = useDisclosure(false);
    const { increment } = useCartOperation();
    const { mainAreaHeight, isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline })
    const [ filter, setFilter ] = useState({
        categories: [],
        search: "",
        barcode: "",
        view: "grid", // grid | list | minimal
    })

    useEffect(() => {
        async function fetchProducts() {
            const fetchedProducts = await window.dbAPI.getDataFromTable("core_products")
            setAllProducts(fetchedProducts)
        }

        fetchProducts()
    }, [])

    // =============== handle product click ================
    const handleProductClick = async (product) => {
        const purchaseItems =
            JSON.parse(product?.purchase_item_for_sales || "[]")

        if (purchaseItems.length > 0) {
            const itemCondition = {
                stock_item_id: product.stock_item_id || product.stock_id,
            };
            const cartItems = await window.dbAPI.getDataFromTable("invoice_table_item", itemCondition);

            let currentBatches = [];
            if (cartItems && cartItems.length > 0) {
                try {
                    currentBatches = typeof cartItems[ 0 ].batches === 'string'
                        ? JSON.parse(cartItems[ 0 ].batches)
                        : (Array.isArray(cartItems[ 0 ].batches) ? cartItems[ 0 ].batches : []);
                } catch {
                    currentBatches = [];
                }
            }

            setSelectedProduct({ ...product, currentBatches });
            openBatchModal();
        } else {
            // =============== directly add to cart ================
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

    const filteredProducts = useMemo(() => {
        const normalizedSearchValue = filter.search.trim().toLowerCase()
        const normalizedBarcodeValue = filter.barcode.trim()
        const selectedCategoryIds = filter.categories

        return allProducts.filter((product) => {
            if (selectedCategoryIds.length > 0 && !selectedCategoryIds.includes(product.category_id)) {
                return false
            }

            if (normalizedSearchValue) {
                const productDisplayName = (product.display_name ?? "").toString().toLowerCase()
                if (!productDisplayName.includes(normalizedSearchValue)) {
                    return false
                }
            }

            if (normalizedBarcodeValue) {
                const productBarcodeValue = (product.barcode ?? "").toString()
                if (!productBarcodeValue.includes(normalizedBarcodeValue)) {
                    return false
                }
            }

            return true
        })
    }, [ allProducts, filter.barcode, filter.categories, filter.search ])

    return (
        <Box bg="white" w="100%" className="border-radius">
            <Grid columns={12} gutter="4xs" pl="3xs" pb="3xs">
                <Grid.Col span={3}>
                    <Categories filter={filter} setFilter={setFilter} />
                </Grid.Col>
                <Grid.Col span={9}>
                    <Box bg="gray.8" px="les" pt="es" pb="les" mb="les" bdrs={6}>
                        <ProductFilters filter={filter} setFilter={setFilter} />
                    </Box>
                    <Box bg="gray.8" p="4xs" bdrs={6}>
                        <ScrollArea h={mainAreaHeight - 60} type="never" scrollbars="y">
                            <Grid columns={12} gutter="4xs">
                                {filter.view !== "minimal" ? <>
                                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                                        <Grid.Col span={filter.view === "grid" ? 3 : filter.view === "list" ? 6 : 12} key={product.id}>
                                            <Card
                                                shadow="md"
                                                radius="md"
                                                padding="xs"
                                                h="100%"
                                                className='cursor-pointer'
                                                styles={() => ({
                                                    root: {
                                                        transition: "transform 0.5s ease-in-out",
                                                    },
                                                })}
                                                onClick={() => handleProductClick(product)}
                                            >
                                                <Image
                                                    radius="sm"
                                                    h={120}
                                                    w="auto"
                                                    fit="cover"
                                                    src={`${import.meta.env.VITE_IMAGE_GATEWAY_URL
                                                        }/uploads/inventory/product/feature_image/${product.feature_image
                                                        }`}
                                                    fallbackSrc="./no-image.png"
                                                />
                                                <Text
                                                    fw={600}
                                                    size="sm"
                                                    fz="13"
                                                    mt="4"
                                                    ta="left"
                                                >
                                                    {product.display_name}
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
                                                    {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol}{" "}
                                                    {product.sales_price}
                                                </Text>
                                            </Card>
                                        </Grid.Col>
                                    )) : (
                                        <Flex bdrs="4px" className='overflow-hidden' w="100%" align="center" justify="center" bg="#ECF0F3" h={mainAreaHeight - 58}>
                                            <Image src="./not-found.webp" w="100%" h="100%" fit="contain" />
                                        </Flex>
                                    )}
                                </> : (
                                    <Box w="100%">
                                        <ProductTable products={filteredProducts} />
                                    </Box>
                                )}
                            </Grid>
                        </ScrollArea>
                    </Box>
                </Grid.Col>
            </Grid>

            <BatchProductModal
                opened={batchModalOpened}
                close={closeBatchModal}
                purchaseItems={JSON.parse(selectedProduct?.purchase_item_for_sales || "[]")}
                currentBatches={selectedProduct?.currentBatches || []}
                onBatchSelect={handleBatchSelect}
            />
        </Box >
    )
}
