import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { IconBarcode, IconBaselineDensitySmall, IconInfoCircle, IconLayoutGrid, IconListDetails, IconSearch, IconX } from '@tabler/icons-react'
import { ActionIcon, Center, Grid, SegmentedControl, TextInput, Tooltip } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';

export default function ProductFilters({ filter, setFilter }) {
    const [ searchInputKey, setSearchInputKey ] = useState(0)
    const { t } = useTranslation()
    const [ isValidBarcode, setIsValidBarcode ] = useState(true)
    const [ barcodeInputValue, setBarcodeInputValue ] = useState(filter.barcode ?? "")
    const [ searchInputValue, setSearchInputValue ] = useState(filter.search ?? "")

    const debouncedBarcodeFilterUpdate = useDebouncedCallback((nextBarcodeValue) => {
        setFilter((previousFilter) => ({
            ...previousFilter,
            barcode: nextBarcodeValue,
        }))
    }, 300)

    const debouncedSearchFilterUpdate = useDebouncedCallback((nextSearchValue) => {
        setFilter((previousFilter) => ({
            ...previousFilter,
            search: nextSearchValue,
        }))
    }, 300)

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
                        value={barcodeInputValue}
                        onChange={(event) => {
                            const nextBarcodeValue = event.target.value
                            setBarcodeInputValue(nextBarcodeValue)
                            debouncedBarcodeFilterUpdate(nextBarcodeValue)
                        }}
                        onKeyDown={(event) => {
                            if (event.key === "Enter" && barcodeInputValue) {
                                console.info(barcodeInputValue)
                            }
                        }}
                        autoComplete="off"
                        leftSection={<IconBarcode size={16} opacity={0.5} />}
                        rightSection={
                            barcodeInputValue ? (
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
                                            setBarcodeInputValue("")
                                            setFilter((previousFilter) => ({
                                                ...previousFilter,
                                                barcode: "",
                                            }))
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
                    key={searchInputKey}
                    radius="sm"
                    leftSection={<IconSearch size={16} opacity={0.5} />}
                    size="md"
                    placeholder={t("SearchFood")}
                    rightSection={
                        searchInputValue ? (
                            <Tooltip label="Clear" withArrow position="top" bg="red.1" c="red.3">
                                <IconX
                                    color="red"
                                    size={16}
                                    opacity={0.5}
                                    className='cursor-pointer'
                                    onClick={() => {
                                        setSearchInputValue("")
                                        setFilter((previousFilter) => ({
                                            ...previousFilter,
                                            search: "",
                                        }))
                                        setSearchInputKey(searchInputKey + 1)
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
                        const nextSearchValue = event.target.value
                        setSearchInputValue(nextSearchValue)
                        debouncedSearchFilterUpdate(nextSearchValue)
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
                    bg="green.6"
                    withItemsBorders={false}
                    fullWidth
                    color="green.4"
                    value={filter.view}
                    onChange={(value) => {
                        setFilter({ ...filter, view: value });
                    }}
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
