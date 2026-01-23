import React, { useEffect, useState } from 'react'
import { Image, ScrollArea, Tooltip, ActionIcon, Box, Card, Center, Grid, SegmentedControl, Text, TextInput } from '@mantine/core'
import { useOutletContext } from 'react-router'
import { useTranslation } from 'react-i18next'
import useGetCategories from '@hooks/useGetCategories';
import { IconBarcode, IconBaselineDensitySmall, IconInfoCircle, IconLayoutGrid, IconListDetails, IconSearch, IconX } from '@tabler/icons-react'
import useConfigData from '@hooks/useConfigData'

export default function ProductList() {
    const { t } = useTranslation()
    const [ products, setProducts ] = useState([])
    const { mainAreaHeight, isOnline } = useOutletContext();
    const { categories } = useGetCategories({ offlineFetch: !isOnline })
    const [ id, setId ] = useState(null)
    const [ isValidBarcode, setIsValidBarcode ] = useState(true)
    const [ barcode, setBarcode ] = useState("")
    const [ searchValue, setSearchValue ] = useState("")
    const [ value, setValue ] = useState("grid")
    const [ filterList, setFilterList ] = useState([])
    const { configData } = useConfigData({ offlineFetch: !isOnline })

    console.log(configData)

    useEffect(() => {
        async function fetchProducts() {
            const products = await window.dbAPI.getDataFromTable("core_products")
            setProducts(products)
        }
        fetchProducts()
    }, [])

    return (
        <Box bg="white" w={"100%"} className="border-radius">
            <Grid columns={12} pl="3xs" pr="3xs" pb="3xs">
                <Grid.Col span={3}>
                    <ScrollArea
                        h={mainAreaHeight}
                        type="never"
                        scrollbars="y"
                    >
                        {categories?.map((data) => (
                            <Box
                                style={{
                                    borderRadius: 4,
                                }}
                                mih={40}
                                mt={"4"}
                                variant="default"
                                key={data.id}
                                // onClick={() => {
                                //     filterProductsbyCategory(data.value);
                                // }}
                                bg={data.id === id ? "green.8" : "gray.8"}
                            >
                                <Text
                                    size={"md"}
                                    pl={14}
                                    pt="3xs"
                                    fw={500}
                                    c="white"
                                >
                                    {data.name}
                                </Text>
                            </Box>
                        ))}
                    </ScrollArea>
                </Grid.Col>
                <Grid.Col span={9}>
                    <Box bg="gray.8" px="les" pt="es" pb="les" mb="les" bdrs={6}>
                        <Grid gutter={{ base: 4 }} align="center" mt={4}>
                            <Grid.Col span={3}>
                                <Tooltip
                                    label={t("BarcodeValidateMessage")}
                                    opened={!isValidBarcode}
                                    px={16}
                                    py={2}
                                    position="top-end"
                                    bg={`red.4`}
                                    c={"white"}
                                    withArrow
                                    offset={2}
                                    zIndex={999}
                                    transitionProps={{
                                        transition: "pop-bottom-left",
                                        duration: 500,
                                    }}
                                >
                                    <TextInput
                                        type="number"
                                        name="barcode"
                                        id="barcode"
                                        size="md"
                                        label=""
                                        placeholder={t("Barcode")}
                                        value={barcode}
                                        onChange={(event) => {
                                            setBarcode(event.target.value);
                                        }}
                                        // onKeyPress={(e) => {
                                        //     if (e.key === "Enter" && barcode) {
                                        //         handleBarcodeSearch(barcode);
                                        //     }
                                        // }}
                                        autoComplete="off"
                                        leftSection={<IconBarcode size={16} opacity={0.5} />}
                                        rightSection={
                                            barcode ? (
                                                <Tooltip
                                                    label={t("Clear")}
                                                    withArrow
                                                    bg={`gray.1`}
                                                    c={`gray.7`}
                                                >
                                                    <ActionIcon
                                                        size="sm"
                                                        variant="transparent"
                                                        onClick={() => {
                                                            setBarcode("");
                                                            setIsValidBarcode(true);
                                                        }}
                                                    >
                                                        <IconX color="red" size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            ) : (
                                                <Tooltip
                                                    label={t("ScanOrTypeBarcode")}
                                                    px={16}
                                                    py={2}
                                                    withArrow
                                                    position={"left"}
                                                    c={"black"}
                                                    bg={`gray.1`}
                                                    transitionProps={{
                                                        transition: "pop-bottom-left",
                                                        duration: 500,
                                                    }}
                                                >
                                                    <IconInfoCircle size={16} opacity={0.5} />
                                                </Tooltip>
                                            )
                                        }
                                    />
                                </Tooltip>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <TextInput
                                    radius="sm"
                                    leftSection={<IconSearch size={16} opacity={0.5} />}
                                    size="md"
                                    placeholder={t("SearchFood")}
                                    rightSection={
                                        searchValue ? (
                                            <Tooltip label="Clear" withArrow position="top" bg="red.1" c="red.3">
                                                <IconX
                                                    color="red"
                                                    size={16}
                                                    opacity={0.5}
                                                    className='cursor-pointer'
                                                    onClick={() => {
                                                        setSearchValue("");
                                                        filterList("");
                                                    }}
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                label="Field is required"
                                                withArrow
                                                position="top"
                                                color="red"
                                            >
                                                <IconInfoCircle size={16} opacity={0.5} />
                                            </Tooltip>
                                        )
                                    }
                                    onChange={(event) => {
                                        setSearchValue(event.target.value);
                                        filterList(event.target.value);
                                    }}
                                />
                            </Grid.Col>
                            <Grid.Col span={3}>
                                <SegmentedControl
                                    styles={{
                                        control: { height: "34px", },
                                        label: { color: "white", paddingBlock: "5px" },
                                        indicator: { paddingBlock: "17px" }
                                    }}
                                    bg={"green.6"}
                                    withItemsBorders={false}
                                    fullWidth
                                    color="green.4"
                                    value={value}
                                    onChange={setValue}
                                    h="100%"
                                    data={[
                                        {
                                            label: (
                                                <Center style={{ gap: 10 }}>
                                                    <IconLayoutGrid
                                                        height={"24"}
                                                        width={"24"}
                                                        stroke={1.5}
                                                    />
                                                </Center>
                                            ),
                                            value: "grid",
                                        },
                                        {
                                            label: (
                                                <Center style={{ gap: 10 }}>
                                                    <IconListDetails
                                                        height={"24"}
                                                        width={"24"}
                                                        stroke={1.5}
                                                    />
                                                </Center>
                                            ),
                                            value: "list",
                                        },
                                        {
                                            label: (
                                                <Center style={{ gap: 10 }}>
                                                    <IconBaselineDensitySmall
                                                        height={"24"}
                                                        width={"24"}
                                                        stroke={1.5}
                                                    />
                                                </Center>
                                            ),
                                            value: "minimal",
                                        },
                                    ]}
                                />
                            </Grid.Col>
                        </Grid>
                    </Box>
                    <ScrollArea h={mainAreaHeight - 60} type="never" scrollbars="y">
                        <Box bg="gray.8" px="les" pt="les" pb="les" bdrs={6}>
                            <Grid columns={12} gutter="les">
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
                        </Box>
                    </ScrollArea>
                </Grid.Col>
            </Grid>

        </Box >
    )
}
