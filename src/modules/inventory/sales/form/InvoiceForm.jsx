import { ActionIcon, Box, Button, Flex, NumberInput, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import {
	IconBarcode,
	IconCurrencyTaka,
	IconPercentage,
	IconPlus,
	IconRefresh,
	IconShoppingCart,
} from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";

import InputNumberForm from "@components/form-builders/InputNumberForm";
import InputForm from "@components/form-builders/InputForm";
import AddProductDrawer from "@components/drawers/AddProductDrawer";
import useLocalProductList from "@hooks/useLocalProductList";
import useGetCategories from "@hooks/useGetCategories";
import useConfigData from "@hooks/useConfigData";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { escapeHtmlForVirtualSelectEmptyState, formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { salesItemFormRequest } from "../helpers/request";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import VirtualSearchSelect from "@components/form-builders/VirtualSearchSelect";
import { useTranslation } from "react-i18next";

const PRODUCT_POS_BUTTON_STYLE =
	"display:block;width:100%;padding:6px 10px;margin:0;border:1px solid red;border-radius:4px;background:red;color:white;cursor:pointer;font-size:12px;text-align:center;";

const PRODUCT_PRODUCT_BUTTON_STYLE =
	"display:block;width:100%;padding:6px 10px;margin:0;border:1px solid blue;border-radius:4px;background:blue;color:white;cursor:pointer;font-size:12px;text-align:center;";

const PRODUCT_CUSTOMER_BUTTON_STYLE =
	"display:block;width:100%;padding:6px 10px;margin:0;border:1px solid gray;border-radius:4px;background:gray;color:white;cursor:pointer;font-size:12px;text-align:center;";

const PRODUCT_DISCOUNT_BUTTON_STYLE =
	"display:block;width:100%;padding:6px 10px;margin:0;border:1px solid orange;border-radius:4px;background:orange;color:white;cursor:pointer;font-size:12px;text-align:center;";

const PRODUCT_PAYMENT_BUTTON_STYLE =
	"display:block;width:100%;padding:6px 10px;margin:0;border:1px solid green;border-radius:4px;background:green;color:white;cursor:pointer;font-size:12px;text-align:center;";

export default function InvoiceForm({ refetch, onAddItem }) {
	const { t } = useTranslation();
	const [ productResetKey, setProductResetKey ] = useState(0);
	const { currencySymbol } = useConfigData();
	const itemsForm = useForm(salesItemFormRequest(t));
	const { categories } = useGetCategories();

	const [ isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer } ] =
		useDisclosure(false);

	// =============== declarative product list — fetches all products on mount ===============
	const { products } = useLocalProductList({
		queryOptions: { orderBy: "product_name ASC" },
	});

	const productOptions = products?.map((product) => ({
		value: String(product.id),
		label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.sales_price}`,
		sales_price: product.sales_price,
		purchase_price: product.purchase_price,
		unit: product.unit_name,
	}));

	// =============== effective price = MRP * (1 - discount/100); used for sub_total and cart ===============
	const baseMRP = Number(itemsForm.values.salesPrice) || 0;
	const discountPercent = Number(itemsForm.values.discount) || 0;
	const effectivePrice = baseMRP * (1 - discountPercent / 100);

	const handleAddItemToSalesForm = async () => {
		const { productId, salesPrice, quantity } = itemsForm.values;

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
		const mrpNumber = Number(salesPrice) || Number(selectedProduct.sales_price) || 0;
		const percentNumber = Number(itemsForm.values.discount) || 0;
		const effectivePriceNumber = mrpNumber * (1 - percentNumber / 100);

		// =============== resolve category_name from category_id using local categories ===============
		const categoryId = selectedProduct.category_id ?? null;
		const categoryName =
			categories?.find((cat) => cat.id === categoryId)?.name ?? "";

		// =============== build item matching temp_sales_products NOT NULL columns ===============
		const newItem = {
			product_id: selectedProduct.id,
			display_name: selectedProduct.display_name,
			sales_price: effectivePriceNumber,
			price: mrpNumber,
			mrp: Number(selectedProduct.sales_price ?? 0),
			percent: percentNumber,
			stock: Number(selectedProduct.quantity ?? 0),
			quantity: quantityNumber,
			unit_name: selectedProduct.unit_name || itemsForm.values.unit || "",
			purchase_price: Number(selectedProduct.purchase_price ?? 0),
			average_price: Number(selectedProduct.average_price ?? 0),
			sub_total: quantityNumber * effectivePriceNumber,
			unit_id: selectedProduct.unit_id || null,
			category_id: categoryId,
			category_name: categoryName,
			type: "sales",
		};

		if (onAddItem) {
			// =============== edit mode: delegate to parent state, skip temp table entirely ===============
			onAddItem(newItem);
		} else {
			// =============== create mode: persist item into local temp_sales_products table ===============
			await window.dbAPI.upsertIntoTable("temp_sales_products", newItem);
			refetch();
		}

		handleResetSalesItemForm();
		showNotification(t("ItemAddedSuccessfully"), "teal");
	};

	const invoiceSubTotal = (Number(itemsForm.values.quantity) || 0) * effectivePrice;

	const handleResetSalesItemForm = () => {
		itemsForm.reset();
		setProductResetKey((previousKey) => previousKey + 1);
		requestAnimationFrame(() => {
			document.getElementById("productId").open();
		});
	};

	const handleProductSelect = (value, option) => {
		itemsForm.setFieldValue("productId", value);
		itemsForm.setFieldValue("salesPrice", option?.sales_price);
		itemsForm.setFieldValue("discount", 0);
		itemsForm.setFieldValue("unit", option?.unit);
		requestAnimationFrame(() => document.getElementById("quantity").focus());
	};

	const productNothingFoundHtml = useMemo(() => {
		const labelAdd = escapeHtmlForVirtualSelectEmptyState(t("Product"));
		const labelCustomer = escapeHtmlForVirtualSelectEmptyState(t("Customer"));
		const labelPayment = escapeHtmlForVirtualSelectEmptyState(t("Payment"));
		const labelDiscount = escapeHtmlForVirtualSelectEmptyState(t("Discount"));
		const labelPos = escapeHtmlForVirtualSelectEmptyState(t("POS"));
		return (
			`<div class="invoice-product-empty-markup" style="display:flex;gap:8px;padding:8px;">` +
			`<button type="button" data-virtual-search-empty-action="addProduct" style="${PRODUCT_PRODUCT_BUTTON_STYLE}">${labelAdd}</button>` +
			`<button type="button" data-virtual-search-empty-action="selectCustomer" style="${PRODUCT_CUSTOMER_BUTTON_STYLE}">${labelCustomer}</button>` +
			`<button type="button" data-virtual-search-empty-action="payment" style="${PRODUCT_PAYMENT_BUTTON_STYLE}">${labelPayment}</button>` +
			`<button type="button" data-virtual-search-empty-action="discount" style="${PRODUCT_DISCOUNT_BUTTON_STYLE}">${labelDiscount}</button>` +
			`<button type="button" data-virtual-search-empty-action="pos" style="${PRODUCT_POS_BUTTON_STYLE}">${labelPos}</button>` +
			`</div>`
		);
	}, [ t ]);

	const handleProductNothingFoundAction = useCallback(
		(action) => {
			const productHost = document.getElementById("productId");
			const virtualSelectInstance = productHost?.virtualSelect;
			if (virtualSelectInstance && typeof virtualSelectInstance.closeDropbox === "function") {
				virtualSelectInstance.closeDropbox();
			}

			if (action === "addProduct") {
				openProductDrawer();
				return;
			}
			if (action === "selectCustomer") {
				document.getElementById("customerSelect")?.focus();
				return;
			}

			if (action === "payment") {
				document.getElementById("paymentAmount")?.focus();
			}
			if (action === "discount") {
				document.getElementById("discount-input")?.focus();
			}
			if (action === "pos") {
				document.getElementById("pos")?.focus();
			}
		},
		[ openProductDrawer ],
	);

	useHotkeys([ [ "alt+a", () => document.getElementById("EntityFormSubmit")?.click() ] ]);

	return (
		<>
			<Box
				component="form"
				onSubmit={itemsForm.onSubmit(handleAddItemToSalesForm)}
				bd="1px solid #dee2e6"
				className="borderRadiusAll"
				px="sm"
				py="xs"
				bg="var(--theme-primary-card-color)">
				<Flex gap="xs" align="flex-end" wrap="nowrap">
					{/* =============== barcode input =============== */}
					<Box w={200} style={{ flexShrink: 0 }}>
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
					</Box>

					{/* =============== category filter select =============== */}
					{/* <Box w={160} style={{ flexShrink: 0 }}>
						<Select
							placeholder="All categories"
							data={[
								{ value: "", label: "All categories" },
								...(productCategoryData?.data?.map((item) => ({
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
					</Box> */}

					{/* =============== product search select with add-product drawer trigger =============== */}
					<Flex gap={4} align="flex-end" style={{ flex: 1, minWidth: 200 }}>
						<Box style={{ flex: 1 }}>
							<FormValidationWrapper
								errorMessage={t("ProductRequired")}
								opened={!!itemsForm.errors.productId}
							>
								<Box pos="relative">
									<VirtualSearchSelect
										key={productResetKey}
										value={itemsForm.values.productId}
										options={productOptions}
										placeholder={t("EnterStockProductName")}
										searchable
										showOptionsOnlyOnSearch={true}
										nothingFoundMessage={t("ChangeSearchTermProduct")}
										nothingFoundHtml={productNothingFoundHtml}
										onNothingFoundAction={handleProductNothingFoundAction}
										onChange={handleProductSelect}
										id="productId"
									/>
								</Box>
							</FormValidationWrapper>
						</Box>
						<ActionIcon
							id="OpenProductDrawerBtn"
							variant="outline"
							bg="white"
							radius="sm"
							size={36}
							onClick={openProductDrawer}
							style={{ flexShrink: 0 }}
						>
							<IconPlus size={18} />
						</ActionIcon>
					</Flex>

					{/* =============== quantity input =============== */}
					<Box w={110} style={{ flexShrink: 0 }}>
						<InputNumberForm
							classNames={{ input: "sales-price-input" }}
							form={itemsForm}
							name="quantity"
							id="quantity"
							label=""
							placeholder={t("QTY")}
							nextField="salesPrice"
							required={false}
							tooltip={itemsForm.errors.quantity}
							rightIcon={
								<Text fz="xs" fw={500}>
									{itemsForm.values.unit || "Unit"}
								</Text>
							}
						/>
					</Box>

					<Box w={130} style={{ flexShrink: 0 }}>
						<NumberInput
							{...itemsForm.getInputProps("discount", { type: "number" })}
							id="discount"
							placeholder={t("Percent")}
							hideControls
							max={100}
							clampBehavior="strict"
							leftSection={<IconPercentage size={16} opacity={0.6} />}
						/>
					</Box>

					{/* =============== sales price input =============== */}
					<Box w={130} style={{ flexShrink: 0 }}>
						<FormValidationWrapper
							errorMessage={t("SalesPriceRequired")}
							opened={!!itemsForm.errors.salesPrice}
						>
							<NumberInput
								{...itemsForm.getInputProps("salesPrice", { type: "number" })}
								id="salesPrice"
								placeholder={t("SalesPrice")}
								hideControls
								onKeyDown={(event) => {
									if (event.key === "Enter") {
										event.preventDefault();
										document.getElementById("EntityFormSubmit").click();
									}
								}}
								leftSection={<IconCurrencyTaka size={16} opacity={0.6} />}
							/>
						</FormValidationWrapper>
					</Box>

					{/* =============== live sub total display =============== */}
					<Flex
						align="center"
						gap={4}
						px="xs"
						style={{
							flexShrink: 0,
							height: 36,
							border: "1px solid #dee2e6",
							borderRadius: 4,
							minWidth: 100,
							background: "var(--theme-primary-color-0)",
						}}
					>
						<IconCurrencyTaka size={13} opacity={0.7} />
						<Text fz="sm" fw={600}>
							{formatCurrency(invoiceSubTotal)}
						</Text>
					</Flex>

					{/* =============== reset and add buttons =============== */}
					<ActionIcon
						onClick={handleResetSalesItemForm}
						variant="outline"
						radius="xl"
						bg="white"
						size={36}
						color="var(--theme-primary-color-6)"
						style={{ flexShrink: 0 }}
					>
						<IconRefresh size={18} />
					</ActionIcon>

					<Button
						leftSection={<IconPlus size={16} />}
						rightSection={<IconShoppingCart size={15} />}
						bg={'red'}
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
				setStockProductRestore={() => { }}
				focusField="productId"
				fieldPrefix=""
			/>
		</>
	);
}
