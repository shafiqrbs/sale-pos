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
import InputNumberForm from "@components/form-builders/InputNumberForm";
import InputForm from "@components/form-builders/InputForm";
import AddProductDrawer from "@components/drawers/AddProductDrawer";
import useLocalProducts from "@hooks/useLocalProducts";
import useConfigData from "@hooks/useConfigData";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { invoiceItemFormRequest } from "../helpers/request";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import VirtualSearchSelect from "@components/form-builders/VirtualSearchSelect";
import DateInputForm from "@components/form-builders/DateInputForm";

import { useEffect, useState } from "react";
import { useGetInventoryCategoryQuery } from "@services/settings";

export default function InvoiceForm({ refetch }) {
	const [products, setProducts] = useState([]);
	const [productResetKey, setProductResetKey] = useState(0);
	const [selectedCategoryId, setSelectedCategoryId] = useState(null);
	const { configData } = useConfigData();
	const invoiceItemForm = useForm(invoiceItemFormRequest());
	const { getLocalProducts } = useLocalProducts({
		fetchOnMount: false,
	});

	const { data: productCategoryData } = useGetInventoryCategoryQuery({ type: "parent" });
	const { mainAreaHeight } = useMainAreaHeight();
	const [isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer }] =
		useDisclosure(false);

	// =============== fetch products in db entry order (id ASC), same as sales product select ===============
	useEffect(() => {
		getLocalProducts({ category_id: selectedCategoryId }, "id", {
			orderBy: "product_name ASC",
		}).then((fetchedProducts) => {
			setProducts(fetchedProducts);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedCategoryId]);

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const productOptions = products?.map((product) => ({
		value: String(product.id),
		label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.purchase_price}`,
		purchase_price: product.purchase_price,
		unit: product.unit_name,
	}));

	const containerHeight = mainAreaHeight - 170;

	const handleAddItemToPurchaseForm = async () => {
		const { productId, purchasePrice, quantity, expired_date } = invoiceItemForm.values;

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
		const priceNumber =
			Number(purchasePrice) ||
			Number(selectedProduct.purchase_price) ||
			Number(selectedProduct.sales_price) ||
			0;

		const newItem = {
			product_id: selectedProduct.id,
			display_name: selectedProduct.display_name,
			quantity: quantityNumber,
			purchase_price: priceNumber,
			mrp: Number(selectedProduct.purchase_price) || 0,
			sales_price: Number(selectedProduct.sales_price) || priceNumber,
			sub_total: quantityNumber * priceNumber,
			unit_name: selectedProduct.unit_name || invoiceItemForm.values.unit || "",
			type: "purchase",
			price: priceNumber,
			expired_date,
		};

		// =============== persist new item into local temp_purchase_products table ===============
		await window.dbAPI.upsertIntoTable("temp_purchase_products", newItem);
		refetch();

		handleResetInvoiceItemForm();
		showNotification("Item added successfully", "teal");
	};

	const invoiceSubTotal =
		(Number(invoiceItemForm.values.quantity) || 0) *
		(Number(invoiceItemForm.values.purchasePrice) || 0);

	const handleResetInvoiceItemForm = () => {
		invoiceItemForm.reset();
		setProductResetKey((prev) => prev + 1);
		requestAnimationFrame(() => {
			document.getElementById("productId")?.open?.();
		});
	};

	const handleProductSelect = (value, option) => {
		invoiceItemForm.setFieldValue("productId", value);
		invoiceItemForm.setFieldValue("purchasePrice", option?.purchase_price);
		invoiceItemForm.setFieldValue("unit", option?.unit);
		requestAnimationFrame(() => document.getElementById("quantity").focus());
	};

	useHotkeys([["alt+a", () => document.getElementById("EntityFormSubmit")?.click()]]);

	return (
		<>
			<Box
				component="form"
				onSubmit={invoiceItemForm.onSubmit(handleAddItemToPurchaseForm)}
				bd="1px solid #dee2e6"
				bg="white"
				className="borderRadiusAll"
			>
				<Box p="sm" fz="sm" fw={600} className="boxBackground textColor borderRadiusAll">
					Vendor Purchase Invoice
				</Box>

				<Divider />

				<ScrollArea h={containerHeight} type="never">
					<Box p="sm">
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
						<Select
							mt="4xs"
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
						<Flex mt="4xs" gap="4" align="flex-end">
							<Box style={{ flex: 1 }}>
								<FormValidationWrapper
									errorMessage="Product is required"
									opened={!!invoiceItemForm.errors.productId}
								>
									<Box pos="relative">
										<VirtualSearchSelect
											key={productResetKey}
											value={invoiceItemForm.values.productId}
											options={productOptions}
											placeholder="Choose Product"
											searchable
											nothingFoundMessage="Change the search term to find a product"
											onChange={handleProductSelect}
											id="productId"
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
							<Grid.Col span={12}>
								<InputNumberForm
									form={invoiceItemForm}
									name="purchasePrice"
									id="purchasePrice"
									label="Purchase Price"
									nextField="quantity"
									placeholder="0.00"
									tooltip={invoiceItemForm.errors.purchasePrice}
									leftSection={<IconCurrencyTaka size={16} opacity={0.6} />}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<InputNumberForm
									form={invoiceItemForm}
									name="quantity"
									id="quantity"
									label="Quantity"
									placeholder="0"
									nextField="EntityFormSubmit"
									required={false}
									tooltip={invoiceItemForm.errors.quantity}
									rightIcon={
										<Text fz="xs" fw={500}>
											{invoiceItemForm.values.unit || "Unit"}
										</Text>
									}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<DateInputForm
									form={invoiceItemForm}
									name="expired_date"
									id="expired_date"
									placeholder="DD-MM-YYYY"
									valueFormat="DD-MM-YYYY"
									clearable
									tooltip={invoiceItemForm.errors.expired_date}
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
					bg="var(--theme-primary-color-0)"
				>
					<Text fz="sm" fw={500}>
						Sub Total
					</Text>
					<Flex align="center" gap="4">
						<IconCurrencyTaka size={14} />
						<Text fz="sm" fw={600}>
							{formatCurrency(invoiceSubTotal)}
						</Text>
					</Flex>
				</Flex>

				<Flex p="sm" justify="space-between" align="center">
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
