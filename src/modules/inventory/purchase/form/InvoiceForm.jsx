import React from "react";
import {
    ActionIcon,
    Box,
    Button,
    Flex,
    Grid,
    ScrollArea,
    Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    IconBarcode,
    IconCurrencyTaka,
    IconPlus,
    IconRefresh,
    IconShoppingCart,
} from "@tabler/icons-react";

import useMainAreaHeight from "@hooks/useMainAreaHeight";
import SelectForm from "@components/form-builders/SelectForm";
import InputNumberForm from "@components/form-builders/InputNumberForm";
import InputForm from "@components/form-builders/InputForm";
import AddProductDrawer from "@components/drawers/AddProductDrawer";
import useLocalProducts from "@hooks/useLocalProducts";
import useConfigData from "@hooks/useConfigData";
import { useDisclosure } from "@mantine/hooks";

export default function InvoiceForm({ purchaseForm }) {
    const { configData } = useConfigData();
    const { products } = useLocalProducts();
    const { mainAreaHeight } = useMainAreaHeight();
    const [ isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer } ] = useDisclosure(false);
    const invoiceItemForm = useForm({
        initialValues: {
            barcode: "",
            productId: "",
            purchasePrice: "",
            quantity: "",
        },
    });

    const currencySymbol = configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;
    const productOptions = products?.map((product) => ({
        value: String(product.id),
        label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.sales_price}`,
    }));

    const containerHeight = mainAreaHeight - 170;

    const handleAddItemToPurchaseForm = () => {
        const { productId, purchasePrice, quantity } = invoiceItemForm.values;

        if (!productId || !quantity) {
            return;
        }

        const selectedProduct = products?.find(
            (product) => String(product.id) === String(productId)
        );

        if (!selectedProduct) {
            return;
        }

        const quantityNumber = Number(quantity) || 0;
        const priceNumber =
            Number(purchasePrice) ||
            Number(selectedProduct.purchase_price) ||
            Number(selectedProduct.sales_price) ||
            0;

        const newItem = {
            id: Date.now(),
            productId: selectedProduct.id,
            productName: selectedProduct.display_name,
            quantity: quantityNumber,
            price: priceNumber,
        };

        // =============== push new item into main purchase form list using mantine helpers ===============
        purchaseForm.insertListItem("items", newItem);

        invoiceItemForm.reset();
    };

    const invoiceSubTotal =
        (Number(invoiceItemForm.values.quantity) || 0) *
        (Number(invoiceItemForm.values.purchasePrice) || 0);

    return (
        <>
            <Box
                bd="1px solid #dee2e6"
                bg="white"
                p="3xs"
                className="borderRadiusAll"
            >
                <Box
                    h={36}
                    px="xs"
                    fz="sm"
                    fw={600}
                    pt={6}
                    mb={4}
                    className="boxBackground textColor borderRadiusAll"
                >
                    Vendor Purchase Invoice
                </Box>

                <ScrollArea h={containerHeight} type="never">
                    <Box px="xs" pb="xs">
                        <Grid gutter={4}>
                            <Grid.Col span={12}>
                                <InputForm
                                    form={invoiceItemForm}
                                    name="barcode"
                                    id="barcode"
                                    label=""
                                    placeholder="Barcode"
                                    required={false}
                                    tooltip=""
                                    leftSection={<IconBarcode size={16} opacity={0.6} />}
                                />
                            </Grid.Col>
                        </Grid>

                        <Flex mt={4} gap="xs" align="flex-end">
                            <Box style={{ flex: 1 }}>
                                <SelectForm
                                    form={invoiceItemForm}
                                    name="productId"
                                    id="productId"
                                    label=""
                                    placeholder="Choose Product"
                                    required={false}
                                    dropdownValue={productOptions}
                                    searchable
                                    tooltip=""
                                />
                            </Box>
                            <ActionIcon
                                variant="filled"
                                color="var(--theme-primary-color-6)"
                                radius="sm"
                                size="lg"
                                onClick={openProductDrawer}
                            >
                                <IconPlus size={18} />
                            </ActionIcon>
                        </Flex>

                        <Grid gutter={4} mt="sm">
                            <Grid.Col span={12}>
                                <InputNumberForm
                                    form={invoiceItemForm}
                                    name="purchasePrice"
                                    id="purchasePrice"
                                    label="Purchase Price"
                                    placeholder="0"
                                    required={false}
                                    tooltip=""
                                    leftSection={
                                        <IconCurrencyTaka
                                            size={16}
                                            opacity={0.6}
                                        />
                                    }
                                />
                            </Grid.Col>
                            <Grid.Col span={12}>
                                <InputNumberForm
                                    form={invoiceItemForm}
                                    name="quantity"
                                    id="quantity"
                                    label="Quantity"
                                    placeholder="Quantity"
                                    required={false}
                                    tooltip=""
                                    rightIcon={
                                        <Text fz="xs" fw={500}>
                                            Kg
                                        </Text>
                                    }
                                />
                            </Grid.Col>
                        </Grid>

                    </Box>
                </ScrollArea>
                <Flex
                    mt="md"
                    px={4}
                    py={6}
                    justify="space-between"
                    align="center"
                    bd="1px solid #e6e6e6"
                    className="borderRadiusAll"
                >
                    <Text fz="sm" fw={500}>
                        Sub Total
                    </Text>
                    <Flex align="center" gap={4}>
                        <IconCurrencyTaka size={14} />
                        <Text fz="sm" fw={600}>
                            {invoiceSubTotal.toFixed(2)}
                        </Text>
                    </Flex>
                </Flex>

                <Flex mt="md" justify="space-between" align="center">
                    <ActionIcon
                        variant="outline"
                        radius="xl"
                        size="lg"
                        color="var(--theme-primary-color-6)"
                    >
                        <IconRefresh size={18} />
                    </ActionIcon>

                    <Button
                        id="EntityFormSubmit"
                        leftSection={<IconPlus size={18} />}
                        rightSection={
                            <IconShoppingCart size={16} />
                        }
                        bg="var(--theme-primary-color-6)"
                        color="white"
                        radius="sm"
                        type="button"
                        onClick={handleAddItemToPurchaseForm}
                    >
                        Add
                    </Button>
                </Flex>
            </Box>

            <AddProductDrawer
                productDrawer={isProductDrawerOpened}
                closeProductDrawer={closeProductDrawer}
                setStockProductRestore={() => { }}
                focusField="productId"
                fieldPrefix=""
            />
        </>
    );
}
