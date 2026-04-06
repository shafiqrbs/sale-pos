import {
	ActionIcon,
	Button,
	Box,
	Divider,
	Flex,
	Grid,
	ScrollArea,
	Stack,
	Text,
	Group,
} from "@mantine/core";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import GlobalDrawer from "./GlobalDrawer.jsx";
import { useEffect, useRef } from "react";
import { useAddProductMutation } from "@services/product.js";
import {
	useGetInventoryParticularQuery,
	useGetInventorySettingsQuery,
} from "@services/settings.js";
import useGetCategories from "@hooks/useGetCategories";
import { useTranslation } from "react-i18next";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import SelectForm from "@components/form-builders/SelectForm.jsx";
import InputForm from "@components/form-builders/InputForm.jsx";
import InputNumberForm from "@components/form-builders/InputNumberForm.jsx";
import {
	IconCoinMonero,
	IconCurrency,
	IconDeviceFloppy,
	IconRefreshDot,
	IconX,
} from "@tabler/icons-react";

export default function AddProductDrawer({
	productDrawer,
	closeProductDrawer,
	setStockProductRestore,
	focusField,
	fieldPrefix,
}) {
	const { mainAreaHeight } = useMainAreaHeight();
	const [addProduct, { isLoading }] = useAddProductMutation();
	const { data: productTypeData } = useGetInventorySettingsQuery({
		"dropdown-type": "product-type",
	});
	const { categories: categoryData } = useGetCategories();
	const { data: productUnitData } = useGetInventoryParticularQuery({
		"dropdown-type": "product-unit",
	});
	const { t } = useTranslation();
	const height = mainAreaHeight - 60;
	const effectRan = useRef(false);

	useEffect(() => {
		!effectRan.current &&
			(setTimeout(() => {
				const element = document.getElementById(fieldPrefix + "product_type_id");
				if (element) {
					element.focus();
				}
			}, 100),
			(effectRan.current = true));
	}, [fieldPrefix]);

	const productAddedForm = useForm({
		initialValues: {
			name: "",
			purchase_price: "",
			sales_price: "",
			unit_id: "",
			category_id: "",
			product_type_id: "",
			quantity: "",
			status: true,
		},
		validate: {
			name: (value) => (value.trim() === "" ? t("NameIsRequired") : null),
			product_type_id: (value) => (value.trim() === "" ? t("ProductTypeRequired") : null),
			category_id: (value) => (value.trim() === "" ? t("CategoryRequired") : null),
			unit_id: (value) => (value.trim() === "" ? t("UnitRequired") : null),
			purchase_price: (value) => (value.trim() === "" ? t("PurchasePriceRequired") : null),
			sales_price: (value) => (value.trim() === "" ? t("SalesPriceRequired") : null),
		},
	});

	const handleProductSubmit = (values) => {
		modals.openConfirmModal({
			title: <Text size="md"> {t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
			labels: { confirm: t("Submit"), cancel: t("Cancel") },
			confirmProps: { color: "red" },
			onCancel: () => console.log("Cancel"),
			onConfirm: async () => {
				try {
					await addProduct(values).unwrap();
					showNotification(t("CreateSuccessfully"), "teal");
				} catch (error) {
					console.error(error);
					showNotification(error.data?.message, "red");
				}

				setTimeout(() => {
					productAddedForm.reset();
					closeProductDrawer();
					setStockProductRestore(true);
					document.getElementById(focusField).focus();
				}, 700);
			},
		});
	};
	return (
		<GlobalDrawer
			opened={productDrawer}
			onClose={closeProductDrawer}
			position="right"
			size="30%"
			title={t("CreateInstantProduct")}
		>
			<Divider />
			<ScrollArea h={mainAreaHeight} scrollbarSize={2} type="never" bg="white">
				<Box component="form" onSubmit={productAddedForm.onSubmit(handleProductSubmit)}>
					<Box mb={0}>
						<Grid columns={9} gutter={{ base: 6 }}>
							<Grid.Col span={9}>
								<Box bg="white" className="borderRadiusAll">
									<Box bg="white">
										<Box className="borderRadiusAll">
											<ScrollArea h={height + 18} scrollbarSize={2} scrollbars="y" type="never">
												<Box mt="8">
													<SelectForm
														tooltip={t("ChooseProductType")}
														label={t("ProductType")}
														placeholder={t("ChooseProductType")}
														required={true}
														name={"product_type_id"}
														form={productAddedForm}
														dropdownValue={productTypeData?.data?.map((item) => ({
															value: String(item.id),
															label: item.name,
														}))}
														id={fieldPrefix + "product_type_id"}
														nextField={fieldPrefix + "category_id"}
														searchable={true}
														comboboxProps={{ withinPortal: false }}
													/>
												</Box>
												<Box mt="xs">
													<SelectForm
														tooltip={t("ChooseCategory")}
														label={t("Category")}
														placeholder={t("ChooseCategory")}
														required={true}
														nextField={fieldPrefix + "name"}
														name={"category_id"}
														form={productAddedForm}
														dropdownValue={categoryData?.map((item) => ({
															value: String(item.id),
															label: item.name,
														}))}
														id={fieldPrefix + "category_id"}
														searchable={true}
														comboboxProps={{ withinPortal: false }}
													/>
												</Box>
												<Box mt="xs">
													<InputForm
														tooltip={t("ProductNameValidateMessage")}
														label={t("ProductName")}
														placeholder={t("ProductName")}
														required={true}
														nextField={fieldPrefix + "unit_id"}
														form={productAddedForm}
														name={"name"}
														id={fieldPrefix + "name"}
													/>
												</Box>
												<Box mt="xs">
													<SelectForm
														tooltip={t("ChooseProductUnit")}
														label={t("ProductUnit")}
														placeholder={t("ChooseProductUnit")}
														required={true}
														name={"unit_id"}
														form={productAddedForm}
														dropdownValue={productUnitData?.data?.map((item) => ({
															value: String(item.id),
															label: item.name,
														}))}
														id={fieldPrefix + "unit_id"}
														nextField={fieldPrefix + "purchase_price"}
														searchable={true}
														comboboxProps={{ withinPortal: false }}
													/>
												</Box>
												<Box mt="xs">
													<InputNumberForm
														tooltip={t("PurchasePriceValidateMessage")}
														label={t("PurchasePrice")}
														placeholder={t("PurchasePrice")}
														required={true}
														nextField={fieldPrefix + "sales_price_product"}
														form={productAddedForm}
														name={"purchase_price"}
														id={fieldPrefix + "purchase_price"}
														leftSection={<IconCoinMonero size={16} opacity={0.5} />}
														rightIcon={<IconCurrency size={16} opacity={0.5} />}
														closeIcon={true}
													/>
												</Box>
												<Box mt="xs">
													<InputNumberForm
														tooltip={t("SalesPriceValidateMessage")}
														label={t("SalesPrice")}
														placeholder={t("SalesPrice")}
														required={true}
														nextField={fieldPrefix + "EntityProductFormSubmit"}
														form={productAddedForm}
														name={"sales_price"}
														id={fieldPrefix + "sales_price_product"}
														leftSection={<IconCoinMonero size={16} opacity={0.5} />}
														rightIcon={<IconCurrency size={16} opacity={0.5} />}
														closeIcon={true}
													/>
												</Box>
											</ScrollArea>
										</Box>
										<Box pt="6" mt="4" className="boxBackground borderRadiusAll">
											<Group justify="space-between">
												<Flex gap="md" justify="center" align="center" direction="row" wrap="wrap">
													<ActionIcon
														variant="transparent"
														size="sm"
														color="var( --theme-remove-color)"
														onClick={closeProductDrawer}
														ml="4"
													>
														<IconX style={{ width: "100%", height: "100%" }} stroke={1.5} />
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
																<IconRefreshDot
																	style={{ width: "100%", height: "60%" }}
																	stroke={1.5}
																/>
															}
															onClick={() => {
																productAddedForm.reset();
															}}
														></Button>
													</Flex>
													<Stack align="flex-end">
														<>
															{!isLoading && (
																<Button
																	size="xs"
																	className={"btnPrimaryBg"}
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
															)}
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
				</Box>
			</ScrollArea>
		</GlobalDrawer>
	);
}
