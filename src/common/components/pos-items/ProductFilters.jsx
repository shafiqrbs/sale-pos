import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { IconBarcode, IconBaselineDensitySmall, IconInfoCircle, IconLayoutGrid, IconListDetails, IconSearch, IconX } from '@tabler/icons-react'
import { ActionIcon, Center, Grid, SegmentedControl, TextInput, Tooltip } from '@mantine/core';

export default function ProductFilters() {
    const { t } = useTranslation()
    const [ isValidBarcode, setIsValidBarcode ] = useState(true)
    const [ barcode, setBarcode ] = useState("")
    const [ searchValue, setSearchValue ] = useState("")
    const [ value, setValue ] = useState("grid")
    const [ filterList, setFilterList ] = useState([])

    return (
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
    )
}
