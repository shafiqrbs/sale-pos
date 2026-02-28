import { useEffect, useRef } from "react";
import { useOutletContext } from "react-router";
import {
    Button, Flex, Grid, Box, ScrollArea, Text, Title, Stack, Group, ActionIcon
} from "@mantine/core";
import { useTranslation } from 'react-i18next';
import {
    IconDeviceFloppy,
    IconRefreshDot,
    IconCoinMonero,
    IconCurrency,
    IconX,
} from "@tabler/icons-react";
import { isNotEmpty, useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import InputForm from "@components/form-builders/InputForm";
import SelectForm from "@components/form-builders/SelectForm";
import InputNumberForm from "@components/form-builders/InputNumberForm";
import { showNotification } from "@components/ShowNotificationComponent";
import { useAddProductMutation } from "@services/product";
import { useGetInventoryCategoryQuery, useGetInventoryParticularQuery, useGetInventorySettingsQuery } from "@services/settings";

export default function AddProductDrawerForm({ closeProductDrawer, setStockProductRestore, focusField, fieldPrefix }) {
    const [ addProduct, { isLoading } ] = useAddProductMutation();
    const { data: productTypeData } = useGetInventorySettingsQuery({ 'dropdown-type': 'product-type' });
    const { data: categoryData } = useGetInventoryCategoryQuery({ type: 'parent' });
    const { data: productUnitData } = useGetInventoryParticularQuery({ 'dropdown-type': 'product-unit' });
    const { t } = useTranslation();
    const { isOnline, mainAreaHeight } = useOutletContext();
    const height = mainAreaHeight - 120; //TabList height 104
    const effectRan = useRef(false);

    useEffect(() => {
        !effectRan.current && (
            setTimeout(() => {
                const element = document.getElementById(fieldPrefix + 'product_type_id');
                if (element) {
                    element.focus();
                }
            }, 100),
            effectRan.current = true
        )
    }, []);

    const productAddedForm = useForm({
        initialValues: {
            name: '',
            purchase_price: '',
            sales_price: '',
            unit_id: '',
            category_id: '',
            product_type_id: '',
            quantity: '',
            status: true,
        },
        validate: {
            name: isNotEmpty(),
            product_type_id: isNotEmpty(),
            category_id: isNotEmpty(),
            unit_id: isNotEmpty(),
            purchase_price: isNotEmpty(),
            sales_price: isNotEmpty(),
        }
    });

    const handleProductSubmit = (values) => {
        modals.openConfirmModal({
            title: (
                <Text size="md"> {t("FormConfirmationTitle")}</Text>
            ),
            children: (
                <Text size="sm"> {t("FormConfirmationMessage")}</Text>
            ),
            labels: { confirm: t('Submit'), cancel: t('Cancel') }, confirmProps: { color: 'red' },
            onCancel: () => console.log('Cancel'),
            onConfirm: async () => {
                try {
                    await addProduct(values).unwrap();
                    showNotification(t('CreateSuccessfully'), 'teal');
                } catch (error) {
                    console.error(error)
                    showNotification(error.data?.message, 'red');
                }

                setTimeout(() => {
                    productAddedForm.reset()
                    closeProductDrawer()
                    setStockProductRestore(true)
                    document.getElementById(focusField).focus()
                }, 700)
            },
        });
    }

    return (
        <Box component="form" onSubmit={productAddedForm.onSubmit(handleProductSubmit)}>
            <Box mb={0}>
                <Grid columns={9} gutter={{ base: 6 }} >
                    <Grid.Col span={9} >
                        <Box bg={'white'} className={'borderRadiusAll'} >
                            <Box bg={"white"} >
                                <Box pl={`xs`} pr={8} pt={'4'} pb={'6'} mb={'4'} className={'boxBackground borderRadiusAll'} >
                                    <Grid columns={12}>
                                        <Grid.Col span={6} >
                                            <Title order={6} pt={'6'}>{t('InstantProductCreate')}</Title>
                                        </Grid.Col>
                                        <Grid.Col span={6} >

                                        </Grid.Col>
                                    </Grid>
                                </Box>
                                <Box pl={`xs`} pr={'xs'} className={'borderRadiusAll'}>
                                    <ScrollArea h={height + 18} scrollbarSize={2} scrollbars="y" type="never">
                                        <Box mt={'8'}>
                                            <SelectForm
                                                tooltip={t('ChooseProductType')}
                                                label={t('ProductType')}
                                                placeholder={t('ChooseProductType')}
                                                required={true}
                                                name={'product_type_id'}
                                                form={productAddedForm}
                                                dropdownValue={productTypeData?.data?.map((item) => ({ value: String(item.id), label: item.name }))}
                                                id={fieldPrefix + 'product_type_id'}
                                                nextField={fieldPrefix + 'category_id'}
                                                searchable={true}
                                                comboboxProps={{ withinPortal: false }}
                                            />
                                        </Box>
                                        <Box mt={'xs'}>
                                            <SelectForm
                                                tooltip={t('ChooseCategory')}
                                                label={t('Category')}
                                                placeholder={t('ChooseCategory')}
                                                required={true}
                                                nextField={fieldPrefix + 'name'}
                                                name={'category_id'}
                                                form={productAddedForm}
                                                dropdownValue={categoryData?.data?.map((item) => ({ value: String(item.id), label: item.name }))}
                                                id={fieldPrefix + 'category_id'}
                                                searchable={true}
                                                comboboxProps={{ withinPortal: false }}
                                            />
                                        </Box>
                                        <Box mt={'xs'}>
                                            <InputForm
                                                tooltip={t('ProductNameValidateMessage')}
                                                label={t('ProductName')}
                                                placeholder={t('ProductName')}
                                                required={true}
                                                nextField={fieldPrefix + 'unit_id'}
                                                form={productAddedForm}
                                                name={'name'}
                                                id={fieldPrefix + 'name'}
                                            />
                                        </Box>
                                        <Box mt={'xs'}>
                                            <SelectForm
                                                tooltip={t('ChooseProductUnit')}
                                                label={t('ProductUnit')}
                                                placeholder={t('ChooseProductUnit')}
                                                required={true}
                                                name={'unit_id'}
                                                form={productAddedForm}
                                                dropdownValue={productUnitData?.data?.map((item) => ({ value: String(item.id), label: item.name }))}
                                                id={fieldPrefix + 'unit_id'}
                                                nextField={fieldPrefix + 'purchase_price'}
                                                searchable={true}
                                                comboboxProps={{ withinPortal: false }}
                                            />
                                        </Box>
                                        <Box mt={'xs'}>
                                            <InputNumberForm
                                                tooltip={t('PurchasePriceValidateMessage')}
                                                label={t('PurchasePrice')}
                                                placeholder={t('PurchasePrice')}
                                                required={true}
                                                nextField={fieldPrefix + 'sales_price_product'}
                                                form={productAddedForm}
                                                name={'purchase_price'}
                                                id={fieldPrefix + 'purchase_price'}
                                                leftSection={<IconCoinMonero size={16} opacity={0.5} />}
                                                rightIcon={<IconCurrency size={16} opacity={0.5} />}
                                                closeIcon={true}
                                            />
                                        </Box>
                                        <Box mt={'xs'}>
                                            <InputNumberForm
                                                tooltip={t('SalesPriceValidateMessage')}
                                                label={t('SalesPrice')}
                                                placeholder={t('SalesPrice')}
                                                required={true}
                                                nextField={fieldPrefix + 'EntityProductFormSubmit'}
                                                form={productAddedForm}
                                                name={'sales_price'}
                                                id={fieldPrefix + 'sales_price_product'}
                                                leftSection={<IconCoinMonero size={16} opacity={0.5} />}
                                                rightIcon={<IconCurrency size={16} opacity={0.5} />}
                                                closeIcon={true}
                                            />
                                        </Box>
                                    </ScrollArea>
                                </Box>
                                <Box pl={`xs`} pr={8} py={'6'} mb={'2'} mt={4} className={'boxBackground borderRadiusAll'}>
                                    <Group justify="space-between">
                                        <Flex
                                            gap="md"
                                            justify="center"
                                            align="center"
                                            direction="row"
                                            wrap="wrap"
                                        >
                                            <ActionIcon
                                                variant="transparent"
                                                size="sm"
                                                color='var( --theme-remove-color)'
                                                onClick={closeProductDrawer}
                                                ml={'4'}
                                            >
                                                <IconX style={{ width: '100%', height: '100%' }} stroke={1.5} />
                                            </ActionIcon>
                                        </Flex>

                                        <Group gap={8}>
                                            <Flex justify="flex-end" align="center" h="100%">
                                                <Button
                                                    variant="transparent"
                                                    size="xs"
                                                    color="red.4"
                                                    type="reset"
                                                    id=""
                                                    comboboxProps={{ withinPortal: false }}
                                                    p={0}
                                                    rightSection={
                                                        <IconRefreshDot style={{ width: '100%', height: '60%' }} stroke={1.5} />}
                                                    onClick={() => {
                                                        productAddedForm.reset()
                                                    }}

                                                >
                                                </Button>
                                            </Flex>
                                            <Stack align="flex-start">
                                                <>
                                                    {
                                                        !isLoading && isOnline &&
                                                        <Button
                                                            size="xs"
                                                            className={'btnPrimaryBg'}
                                                            type="submit"
                                                            id={fieldPrefix + "EntityProductFormSubmit"}
                                                            leftSection={<IconDeviceFloppy size={16} />}
                                                        >
                                                            <Flex direction={`column`} gap={0}>
                                                                <Text fz={14} fw={400}>
                                                                    {t("CreateAndSave")}
                                                                </Text>
                                                            </Flex>
                                                        </Button>
                                                    }
                                                </>
                                            </Stack>
                                        </Group>
                                    </Group>
                                </Box>
                            </Box>
                        </Box>
                    </Grid.Col>
                </Grid>
            </Box>
        </Box >
    );
}