import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Select,
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
import { useEffect, useState } from "react";

import InputNumberForm from "@components/form-builders/InputNumberForm";
import InputForm from "@components/form-builders/InputForm";
import AddProductDrawer from "@components/drawers/AddProductDrawer";
import useLocalProducts from "@hooks/useLocalProducts";
import useConfigData from "@hooks/useConfigData";
import { useDisclosure } from "@mantine/hooks";
import { formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { salesItemFormRequest } from "../helpers/request";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import { useGetInventoryCategoryQuery } from "@services/settings";

export default function InvoiceForm({ refetch }) {
	const [products, setProducts] = useState([]);
	const [productResetKey, setProductResetKey] = useState(0);
	const [selectedCategoryId, setSelectedCategoryId] = useState(null);
	const { configData } = useConfigData();
	const salesItemForm = useForm(salesItemFormRequest());
	const { getLocalProducts } = useLocalProducts({ fetchOnMount: false });

	const { data: productCategoryData } = useGetInventoryCategoryQuery({ type: "parent" });
	const [isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer }] =
		useDisclosure(false);

	useEffect(() => {
		getLocalProducts({ category_id: selectedCategoryId }).then((fetchedProducts) => {
			setProducts(fetchedProducts);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategoryId]);

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const productOptions = products?.map((product) => ({
		value: String(product.id),
		label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.sales_price}`,
		sales_price: product.sales_price,
		purchase_price: product.purchase_price,
		unit: product.unit_name,
	}));

	const handleAddItemToSalesForm = async () => {
		const { productId, salesPrice, quantity } = salesItemForm.values;

		if (!productId || !quantity) {
			showNotification("Product and quantity are required", "red");
			return;
		}

		const selectedProduct = products?.find((product) => String(product.id) === String(productId));

		if (!selectedProduct) {
			showNotification("Product not found", "red");
			return;
		}

		const quantityNumber = Number(quantity) || 0;
		const priceNumber = Number(salesPrice) || Number(selectedProduct.sales_price) || 0;

		// =============== build item matching temp_sales_products NOT NULL columns ===============
		const newItem = {
			product_id: selectedProduct.id,
			display_name: selectedProduct.display_name,
			sales_price: priceNumber,
			price: priceNumber,
			percent: 0,
			stock: Number(selectedProduct.quantity) || 0,
			quantity: quantityNumber,
			unit_name: selectedProduct.unit_name || salesItemForm.values.unit || "",
			purchase_price: Number(selectedProduct.purchase_price) || 0,
			sub_total: quantityNumber * priceNumber,
			unit_id: selectedProduct.unit_id || null,
			type: "sales",
		};

		// =============== persist item into local temp_sales_products table ===============
		await window.dbAPI.upsertIntoTable("temp_sales_products", newItem);
		refetch();

		handleResetSalesItemForm();
		showNotification("Item added successfully", "teal");
	};

	const invoiceSubTotal =
		(Number(salesItemForm.values.quantity) || 0) *
		(Number(salesItemForm.values.salesPrice) || 0);

	const handleResetSalesItemForm = () => {
		salesItemForm.reset();
		setProductResetKey((previousKey) => previousKey + 1);
		requestAnimationFrame(() => {
			document.getElementById("productId").focus();
		});
	};

	const handleProductSelect = (value, option) => {
		salesItemForm.setFieldValue("productId", value);
		salesItemForm.setFieldValue("salesPrice", option?.sales_price);
		salesItemForm.setFieldValue("unit", option?.unit);
		document.getElementById("quantity").focus();
	};

	return (
		<>
			<Box
				component="form"
				onSubmit={salesItemForm.onSubmit(handleAddItemToSalesForm)}
				bd="1px solid #dee2e6"
				bg="white"
				className="borderRadiusAll"
				px="sm"
				py="xs"
			>
				<Flex gap="xs" align="flex-end" wrap="nowrap">
					{/* =============== barcode input =============== */}
					<Box w={130} style={{ flexShrink: 0 }}>
						<InputForm
							form={salesItemForm}
							name="barcode"
							id="barcode"
							label=""
							placeholder="Barcode"
							required={false}
							tooltip=""
							leftSection={<IconBarcode size={16} opacity={0.6} />}
						/>
					</Box>

					{/* =============== category filter select =============== */}
					<Box w={160} style={{ flexShrink: 0 }}>
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
					</Box>

					{/* =============== product search select with add-product drawer trigger =============== */}
					<Flex gap={4} align="flex-end" style={{ flex: 1, minWidth: 200 }}>
						<Box style={{ flex: 1 }}>
							<FormValidationWrapper
								errorMessage="Product is required"
								opened={!!salesItemForm.errors.productId}
							>
								<Select
									key={productResetKey}
									placeholder="Enter stock product name"
									data={productOptions}
									searchable
									id="productId"
									{...salesItemForm.getInputProps("productId", { type: "search" })}
									onChange={handleProductSelect}
									nothingFoundMessage="No product found"
								/>
							</FormValidationWrapper>
						</Box>
						<ActionIcon
							variant="filled"
							color="var(--theme-primary-color-6)"
							radius="sm"
							size={36}
							onClick={openProductDrawer}
							style={{ flexShrink: 0 }}
						>
							<IconPlus size={18} />
						</ActionIcon>
					</Flex>

					{/* =============== sales price input =============== */}
					<Box w={130} style={{ flexShrink: 0 }}>
						<InputNumberForm
							form={salesItemForm}
							name="salesPrice"
							id="salesPrice"
							label=""
							nextField="quantity"
							placeholder="Price"
							required={false}
							tooltip={salesItemForm.errors.salesPrice}
							leftSection={<IconCurrencyTaka size={16} opacity={0.6} />}
						/>
					</Box>

					{/* =============== quantity input =============== */}
					<Box w={110} style={{ flexShrink: 0 }}>
						<InputNumberForm
							form={salesItemForm}
							name="quantity"
							id="quantity"
							label=""
							placeholder="QTY"
							nextField="EntityFormSubmit"
							required={false}
							tooltip={salesItemForm.errors.quantity}
							rightIcon={
								<Text fz="xs" fw={500}>
									{salesItemForm.values.unit || "Unit"}
								</Text>
							}
						/>
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
						size={36}
						color="var(--theme-primary-color-6)"
						style={{ flexShrink: 0 }}
					>
						<IconRefresh size={18} />
					</ActionIcon>

					<Button
						leftSection={<IconPlus size={16} />}
						rightSection={<IconShoppingCart size={15} />}
						bg="var(--theme-primary-color-6)"
						color="white"
						radius="sm"
						type="submit"
						id="EntityFormSubmit"
						style={{ flexShrink: 0 }}
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
