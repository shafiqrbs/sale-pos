import {
	ActionIcon,
	Box,
	Button,
	Divider,
	Flex,
	Grid,
	ScrollArea,
	Select,
	Text,
	Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
	IconBarcode,
	IconCurrencyTaka,
	IconNumber,
	IconPercentage,
	IconPlus,
	IconRefresh,
	IconShoppingCart,
	IconSortAscendingNumbers,
} from "@tabler/icons-react";

import useMainAreaHeight from "@hooks/useMainAreaHeight";
import InputNumberForm from "@components/form-builders/InputNumberForm";
import InputForm from "@components/form-builders/InputForm";
import AddProductDrawer from "@components/drawers/AddProductDrawer";
import useLocalProductList from "@hooks/useLocalProductList";
import useConfigData from "@hooks/useConfigData";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { formatCurrency, parseJsonArray } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { invoiceItemFormRequest } from "../helpers/request";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import VirtualSearchSelect from "@components/form-builders/VirtualSearchSelect";
import { MonthPickerInput } from "@mantine/dates";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ALLOW_MEASUREMENT_PURCHASE } from "@constants/index";
import useGetCategories from "@hooks/useGetCategories";

export default function InvoiceForm({ refetch, onAddItem }) {
	const { t } = useTranslation();
	const [productResetKey, setProductResetKey] = useState(0);
	const [selectedCategoryId, setSelectedCategoryId] = useState(null);
	const { currencySymbol } = useConfigData();
	const itemsForm = useForm(invoiceItemFormRequest(t));

	const { categories: productCategoryData } = useGetCategories();
	const { mainAreaHeight } = useMainAreaHeight();
	const [isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer }] =
		useDisclosure(false);

	// =============== declarative product list — auto-fetches on category change ===============
	const { products } = useLocalProductList({
		condition: { category_id: selectedCategoryId },
		queryOptions: { orderBy: "product_name ASC" },
	});

	// =============== stable reference so VirtualSearchSelect's setOptions effect only fires when products actually change, not on every keystroke ===============
	const productOptions = useMemo(
		() =>
			products?.map((product) => ({
				value: String(product.id),
				label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.purchase_price}`,
				purchase_price: product.purchase_price,
				unit: product.unit_name,
			})),
		[products, currencySymbol]
	);

	const containerHeight = mainAreaHeight - 162;

	const isProductSelected = !!itemsForm.values.productId;

	const selectedProduct = useMemo(
		() =>
			isProductSelected
				? (products?.find((product) => String(product.id) === String(itemsForm.values.productId)) ??
					null)
				: null,
		// eslint-disable-next-line react-hooks/exhaustive-deps -- isProductSelected is derived from itemsForm.values.productId which is already in deps
		[products, itemsForm.values.productId]
	);

	const productMeasurements = parseJsonArray(selectedProduct?.measurements);

	const measurementOptions = productMeasurements?.map((measurement) => ({
		label: measurement.unit_name,
		value: measurement.unit_name,
		quantity: measurement.quantity,
		is_purchase: measurement.is_purchase,
	}));

	const showMeasurementFields =
		ALLOW_MEASUREMENT_PURCHASE && isProductSelected && productMeasurements.length > 0;

	// =============== when measurement or measurement_quantity changes, derive quantity = measurement_quantity × selected measurement's base quantity ===============
	useEffect(() => {
		if (!showMeasurementFields) return;

		const selectedMeasurementOption = measurementOptions?.find(
			(option) => option.value === itemsForm.values.measurement
		);

		if (!selectedMeasurementOption) return;

		const measurementQuantityNumber = Number(itemsForm.values.measurement_quantity) || 0;
		const baseQuantity = Number(selectedMeasurementOption.quantity) || 0;

		const derivedQuantity = measurementQuantityNumber * baseQuantity;

		itemsForm.setFieldValue("quantity", derivedQuantity > 0 ? String(derivedQuantity) : "");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [itemsForm.values.measurement, itemsForm.values.measurement_quantity]);

	useEffect(() => {
		if (!showMeasurementFields) return;
		itemsForm.setFieldValue(
			"measurement",
			measurementOptions.find((option) => option.is_purchase === 1)?.value?.toString()
		);
	}, [showMeasurementFields]);

	// =============== ref flag: tells the mrp+discount effect to skip when quantity already computed both fields in one setValues call, collapsing 3 renders into 2 ===============
	const quantityComputedBothFields = useRef(false);

	// =============== quantity or product changed → compute total_mrp and purchase_price together in one setValues so only one extra render is triggered ===============
	useEffect(() => {
		const quantity = Number(itemsForm.values.quantity) || 0;
		const salesPrice = Number(selectedProduct?.sales_price) || 0;
		const purchasePrice = Number(selectedProduct?.purchase_price) || 0;
		const totalMrp = quantity > 0 ? salesPrice * quantity : 0;

		quantityComputedBothFields.current = true;
		itemsForm.setValues({
			total_mrp: totalMrp > 0 ? totalMrp.toFixed(2) : "",
			purchase_price: (purchasePrice * quantity).toFixed(2) ?? "",
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [itemsForm.values.quantity, selectedProduct?.id]);

	// =============== discount changed manually → update purchase_price; skipped when the quantity effect already handled it ===============
	useEffect(() => {
		if (quantityComputedBothFields.current) {
			quantityComputedBothFields.current = false;
			return;
		}
		const discountPercent = Number(itemsForm.values.item_percent) || 0;
		const quantity = Number(itemsForm.values.quantity) || 0;
		const purchasePrice = Number(selectedProduct?.purchase_price) * quantity || 0;

		itemsForm.setFieldValue(
			"purchase_price",
			(purchasePrice - (purchasePrice * discountPercent) / 100).toFixed(2) ?? ""
		);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [itemsForm.values.item_percent, itemsForm.values.quantity]);

	const handleAddItemToPurchaseForm = async () => {
		const { productId, purchase_price, total_mrp, quantity, expired_date } = itemsForm.values;

		if (!productId || !quantity) {
			showNotification(t("ProductAndQuantityRequired"), "red");
			return;
		}

		const selectedProduct = products?.find((product) => String(product.id) === String(productId));

		if (!selectedProduct) {
			showNotification(t("ProductNotFound"), "red");
			return;
		}

		const quantityNumber = Number(quantity) || 0;

		// =============== form stores batch totals — divide by quantity to get per-unit values for the table row ===============
		const unitMrp = quantityNumber > 0 ? (Number(total_mrp) || 0) / quantityNumber : 0;
		const unitPurchasePrice =
			quantityNumber > 0 ? (Number(purchase_price) || 0) / quantityNumber : 0;

		// =============== resolve category_name from category_id using local categories ===============
		const categoryId = selectedProduct.category_id ?? null;
		const categoryName = selectedProduct.category ?? "";

		const newItem = {
			product_id: selectedProduct.id,
			display_name: selectedProduct.display_name,
			quantity: quantityNumber,
			purchase_price: unitPurchasePrice,
			mrp: unitMrp,
			average_price: Number(selectedProduct.average_price ?? 0),
			sales_price: Number(selectedProduct.sales_price ?? 0),
			sub_total: quantityNumber * unitPurchasePrice,
			unit_name: selectedProduct.unit_name || itemsForm.values.unit || "",
			category_id: categoryId,
			category_name: categoryName,
			bonus_quantity: Number(itemsForm.values.bonus_quantity) || 0,
			type: "invoice-purchase",
			price: unitPurchasePrice,
			expired_date,
			measurement: itemsForm.values.measurement,
			measurement_quantity: itemsForm.values.measurement_quantity,
		};

		// =============== persist new item into local temp_purchase_products table or pass to edit state ===============
		if (onAddItem) {
			onAddItem(newItem);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", newItem);
			refetch();
		}

		handleResetInvoiceItemForm();
		showNotification(t("ItemAddedSuccessfully"), "teal");
	};

	const invoiceSubTotal =
		(Number(itemsForm.values.quantity) || 0) * (Number(itemsForm.values.purchase_price) || 0);

	const handleResetInvoiceItemForm = () => {
		itemsForm.reset();
		setProductResetKey((prev) => prev + 1);
		requestAnimationFrame(() => {
			document.getElementById("productId")?.open?.();
		});
	};

	const handleProductSelect = (value, option) => {
		itemsForm.setFieldValue("productId", value);
		itemsForm.setFieldValue("purchase_price", option?.purchase_price);
		itemsForm.setFieldValue("unit", option?.unit);
		setTimeout(() => document.getElementById("quantity")?.focus(), 0);
	};

	useHotkeys([["alt+a", () => document.getElementById("EntityFormSubmit")?.click()]]);

	return (
		<>
			<Box
				component="form"
				onSubmit={itemsForm.onSubmit(handleAddItemToPurchaseForm)}
				bd="1px solid #dee2e6"
				bg="white"
				className="borderRadiusAll"
			>
				<Box
					p="sm"
					fz="sm"
					fw={600}
					bg={"#1e40af"}
					c={"white"}
					className="boxBackground textColor borderRadiusAll"
				>
					Vendor Invoice Purchase
				</Box>
				<Divider />
				<ScrollArea h={containerHeight} bg="#f0f4f83d" type="never">
					<Box p="sm">
						<InputForm
							form={itemsForm}
							name="barcode"
							id="barcode"
							label=""
							placeholder={t("Barcode")}
							required={false}
							tooltip=""
							leftSection={<IconBarcode size={16} opacity={0.6} />}
						/>
						<Select
							mt="xs"
							placeholder={t("AllCategories")}
							data={[
								{ value: "", label: t("AllCategories") },
								...(productCategoryData?.map((item) => ({
									value: String(item.id),
									label: item.name,
								})) ?? []),
							]}
							value={selectedCategoryId ?? ""}
							onChange={(value) =>
								setSelectedCategoryId(value === "" || value == null ? null : value)
							}
							clearable
							searchable
						/>
						<Flex mt="md" gap="4" align="flex-end" bg={"#1e40af"} p={"xs"} ml={"-xs"} mr={"-xs"}>
							<Box w="100%">
								<FormValidationWrapper
									errorMessage={t("ProductRequired")}
									opened={!!itemsForm.errors.productId}
								>
									<Box pos="relative">
										<VirtualSearchSelect
											key={productResetKey}
											value={itemsForm.values.productId}
											options={productOptions}
											placeholder={t("ChooseProduct")}
											searchable
											nothingFoundMessage={t("ChangeSearchTermProduct")}
											onChange={handleProductSelect}
											id="productId"
											nextField="quantity"
										/>
									</Box>
								</FormValidationWrapper>
							</Box>
							<ActionIcon
								variant="filled"
								color="var(--theme-primary-color-6)"
								radius="sm"
								size={36}
								onClick={openProductDrawer}
							>
								<IconPlus size={18} />
							</ActionIcon>
						</Flex>

						<Grid gutter={4} mt="sm">
							{showMeasurementFields && (
								<>
									<Grid.Col span={4}>
										<InputNumberForm
											form={itemsForm}
											name="measurement_quantity"
											id="measurement_quantity"
											label="Meas. Qty"
											placeholder="0"
											tooltip={itemsForm.errors.measurement_quantity}
											leftSection={<IconNumber size={16} opacity={0.6} />}
										/>
									</Grid.Col>

									<Grid.Col span={4}>
										<Select
											name="measurement"
											label="Measurement"
											placeholder={t("SelectUnit")}
											disabled={!isProductSelected || itemsForm.values?.measurement_quantity === ""}
											data={measurementOptions}
											{...itemsForm.getInputProps("measurement")}
										/>
									</Grid.Col>
								</>
							)}
							<Grid.Col span={showMeasurementFields ? 4 : 12}>
								<InputNumberForm
									form={itemsForm}
									name="quantity"
									id="quantity"
									label="Quantity"
									placeholder="0"
									nextField="total_mrp"
									value={1}
									disabled={!isProductSelected}
									tooltip={itemsForm.errors.quantity}
									leftSection={<IconSortAscendingNumbers size={16} opacity={0.6} />}
									rightIcon={
										<Text fz="xs" fw={500}>
											{itemsForm.values.unit || "Unit"}
										</Text>
									}
								/>
							</Grid.Col>

							<Grid.Col span={12}>
								<InputNumberForm
									form={itemsForm}
									name="total_mrp"
									id="total_mrp"
									label="Total MRP"
									placeholder="0.00"
									nextField="item_percent"
									disabled={!isProductSelected}
									tooltip={itemsForm.errors.total_mrp}
									leftSection={<IconCurrencyTaka size={16} opacity={0.6} />}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<InputNumberForm
									form={itemsForm}
									name="item_percent"
									id="item_percent"
									label="Discount Percent"
									placeholder="0"
									max={100}
									nextField="purchase_price"
									disabled={!isProductSelected}
									tooltip={itemsForm.errors.item_percent}
									leftSection={<IconPercentage size={16} opacity={0.6} />}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<InputNumberForm
									form={itemsForm}
									name="bonus_quantity"
									id="bonus_quantity"
									label={t("BonusQuantity")}
									placeholder="0"
									nextField="purchase_price"
									disabled={!isProductSelected}
									tooltip={itemsForm.errors.bonus_quantity}
									leftSection={<IconSortAscendingNumbers size={16} opacity={0.6} />}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<InputNumberForm
									form={itemsForm}
									name="purchase_price"
									id="purchase_price"
									label="Total Purchase"
									nextField="expired_date"
									placeholder="0.00"
									step={0.01}
									disabled={!isProductSelected}
									tooltip={itemsForm.errors.purchase_price}
									leftSection={<IconCurrencyTaka size={16} opacity={0.6} />}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<Tooltip
									label={itemsForm.errors.expired_date}
									opened={!!itemsForm.errors.expired_date}
									px={16}
									py={2}
									position="top-end"
									bg="var(--theme-error-color)"
									c="white"
									withArrow
									offset={2}
									zIndex={999}
									transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
								>
									<MonthPickerInput
										label="Expired Date"
										id="expired_date"
										valueFormat="MM-YYYY"
										placeholder="MM-YYYY"
										clearable
										disabled={!isProductSelected}
										value={itemsForm.values.expired_date || null}
										onChange={(dateValue) => itemsForm.setFieldValue("expired_date", dateValue)}
										error={itemsForm.errors.expired_date}
									/>
								</Tooltip>
							</Grid.Col>
							<Grid.Col span={12}>
								<InputNumberForm
									form={itemsForm}
									name="minimum_quantity"
									id="minimum_quantity"
									label="Minimum Quantity"
									placeholder="0"
									nextField="EntityFormSubmit"
									disabled={!isProductSelected}
									tooltip={itemsForm.errors.minimum_quantity}
									leftSection={<IconSortAscendingNumbers size={16} opacity={0.6} />}
								/>
							</Grid.Col>
						</Grid>
					</Box>
				</ScrollArea>
				<Flex
					mt="md"
					px="xs"
					py="4xs"
					justify="space-between"
					align="center"
					bd="1px solid #e6e6e6"
					className="borderRadiusAll"
					bg="var(--theme-primary-card-color)"
				>
					<Text fz="sm" fw={500} c="white">
						Sub Total
					</Text>
					<Flex align="center" gap="4" pr="md">
						<Text fz="sm" c="white" fw={500}>
							{currencySymbol}
						</Text>
						<Text fz="sm" fw={600} c="white">
							{formatCurrency(invoiceSubTotal)}
						</Text>
					</Flex>
				</Flex>

				<Flex p="sm" justify="space-between" align="center" bg="#fffbeb85">
					<ActionIcon
						onClick={handleResetInvoiceItemForm}
						variant="outline"
						radius="xl"
						size="lg"
						color="var(--theme-primary-color-6)"
					>
						<IconRefresh size={18} />
					</ActionIcon>

					<Button
						leftSection={<IconPlus size={18} />}
						rightSection={<IconShoppingCart size={16} />}
						bg="var(--theme-primary-color-6)"
						color="white"
						radius="sm"
						type="submit"
						id="EntityFormSubmit"
					>
						Add
					</Button>
				</Flex>
			</Box>

			<AddProductDrawer
				productDrawer={isProductDrawerOpened}
				closeProductDrawer={closeProductDrawer}
				setStockProductRestore={() => {}}
				focusField="productId"
				fieldPrefix=""
			/>
		</>
	);
}
