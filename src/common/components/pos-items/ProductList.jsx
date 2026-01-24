import React, { useEffect, useState } from 'react'
import { Image, ScrollArea, Box, Card, Grid, Text } from '@mantine/core'
import { useOutletContext } from 'react-router'
import useConfigData from '@hooks/useConfigData'
import Categories from './Categories';
import ProductFilters from './ProductFilters'

export default function ProductList() {
    const [ products, setProducts ] = useState([])
    const { mainAreaHeight, isOnline } = useOutletContext();
    const [ id, setId ] = useState(null)

    const { configData } = useConfigData({ offlineFetch: !isOnline })

    useEffect(() => {
        async function fetchProducts() {
            const products = await window.dbAPI.getDataFromTable("core_products")
            setProducts(products)
        }
        fetchProducts()
    }, [])

    return (
        <Box bg="white" w={"100%"} className="border-radius">
            <Grid columns={12} gutter="4xs" pl="3xs" pb="3xs">
                <Grid.Col span={3}>
                    <Categories id={id} />
                </Grid.Col>
                <Grid.Col span={9}>
                    <Box bg="gray.8" px="les" pt="es" pb="les" mb="les" bdrs={6}>
                        <ProductFilters />
                    </Box>
                    <Box bg="gray.8" p="4xs" bdrs={6}>
                        <ScrollArea h={mainAreaHeight - 60} type="never" scrollbars="y">
                            <Grid columns={12} gutter="4xs">
                                {products.map((product) => (
                                    <Grid.Col span={3} key={product.id}>
                                        <Card
                                            shadow="md"
                                            radius="md"
                                            padding="xs"
                                            h="100%"
                                            className='cursor-pointer'
                                            styles={() => ({
                                                root: {
                                                    transition: "transform 0.5s ease-in-out",
                                                    // transform: selected.includes(product.id)
                                                    //     ? "scale(0.97)"
                                                    //     : undefined,
                                                    // border: selected.includes(product.id)
                                                    //     ? "3px solid green.8"
                                                    //     : "3px solid white",
                                                },
                                            })}
                                        >
                                            <Image
                                                radius="sm"
                                                mih={120}
                                                mah={120}
                                                w="auto"
                                                fit="cover"
                                                src={`${import.meta.env.VITE_IMAGE_GATEWAY_URL
                                                    }/uploads/inventory/product/feature_image/${product.feature_image
                                                    }`}
                                                fallbackSrc={"/no-image.png"}
                                            />
                                            <Text
                                                fw={600}
                                                size="sm"
                                                fz={"13"}
                                                mt={"4"}
                                                ta={"left"}
                                            >
                                                {product.display_name}
                                            </Text>

                                            <Text
                                                styles={{
                                                    root: {
                                                        marginTop: "auto",
                                                    },
                                                }}
                                                ta={"right"}
                                                fw={900}
                                                fz={"18"}
                                                size="md"
                                                c={"green.9"}
                                            >
                                                {configData?.currency?.symbol}{" "}
                                                {product.sales_price}
                                            </Text>
                                        </Card>
                                    </Grid.Col>
                                ))}
                            </Grid>
                        </ScrollArea>
                    </Box>
                </Grid.Col>
            </Grid>
        </Box >
    )
}
