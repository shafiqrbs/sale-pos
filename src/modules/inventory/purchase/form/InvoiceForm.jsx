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
	IconCurrencyTaka, IconNumber,
	IconPlus,
	IconRefresh,
	IconShoppingCart, IconSortAscendingNumbers,
} from "@tabler/icons-react";

import useMainAreaHeight from "@hooks/useMainAreaHeight";
import InputNumberForm from "@components/form-builders/InputNumberForm";
import InputForm from "@components/form-builders/InputForm";
import AddProductDrawer from "@components/drawers/AddProductDrawer";
import useLocalProducts from "@hooks/useLocalProducts";
import useGetCategories from "@hooks/useGetCategories";
import useConfigData from "@hooks/useConfigData";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { invoiceItemFormRequest } from "../helpers/request";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import VirtualSearchSelect from "@components/form-builders/VirtualSearchSelect";
import DateInputForm from "@components/form-builders/DateInputForm";

import React, { useEffect, useState } from "react";
import { useGetInventoryCategoryQuery } from "@services/settings";

export default function InvoiceForm({ refetch, onAddItem }) {
	const [ products, setProducts ] = useState([]);
	const [ productResetKey, setProductResetKey ] = useState(0);
	const [ selectedCategoryId, setSelectedCategoryId ] = useState(null);
	const { currencySymbol } = useConfigData();
	const itemsForm = useForm(invoiceItemFormRequest());
	const { getLocalProducts } = useLocalProducts({
		fetchOnMount: false,
	});
	const { categories } = useGetCategories();

	const { data: productCategoryData } = useGetInventoryCategoryQuery({ type: "parent" });
	const { mainAreaHeight } = useMainAreaHeight();
	const [ isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer } ] =
		useDisclosure(false);

	// =============== fetch products in db entry order (id ASC), same as sales product select ===============
	useEffect(() => {
		getLocalProducts({ category_id: selectedCategoryId }, "id", {
			orderBy: "product_name ASC",
		}).then((fetchedProducts) => {
			setProducts(fetchedProducts);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ selectedCategoryId ]);

	const productOptions = products?.map((product) => ({
		value: String(product.id),
		label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.purchase_price}`,
		purchase_price: product.purchase_price,
		unit: product.unit_name,
	}));

	const containerHeight = mainAreaHeight - 162;

	const handleAddItemToPurchaseForm = async () => {
		const { productId, purchase_price, quantity, expired_date } = itemsForm.values;

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
			Number(purchase_price) ||
			Number(selectedProduct.purchase_price) ||
			Number(selectedProduct.sales_price) ||
			0;

		// =============== resolve category_name from category_id using local categories ===============
		const categoryId = selectedProduct.category_id ?? null;
		const categoryName =
			categories?.find((cat) => cat.id === categoryId)?.name ?? "";

		const newItem = {
			product_id: selectedProduct.id,
			display_name: selectedProduct.display_name,
			quantity: quantityNumber,
			purchase_price: priceNumber,
			mrp: Number(selectedProduct.purchase_price ?? 0),
			average_price: Number(selectedProduct.average_price ?? 0),
			sales_price: Number(selectedProduct.sales_price ?? 0),
			sub_total: quantityNumber * priceNumber,
			unit_name: selectedProduct.unit_name || itemsForm.values.unit || "",
			category_id: categoryId,
			category_name: categoryName,
			type: "purchase",
			price: priceNumber,
			expired_date,
		};

		// =============== persist new item into local temp_purchase_products table or pass to edit state ===============
		if (onAddItem) {
			onAddItem(newItem);
		} else {
			await window.dbAPI.upsertIntoTable("temp_purchase_products", newItem);
			refetch();
		}

		handleResetInvoiceItemForm();
		showNotification("Item added successfully", "teal");
	};

	const invoiceSubTotal =
		(Number(itemsForm.values.quantity) || 0) *
		(Number(itemsForm.values.purchase_price) || 0);

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

	useHotkeys([ [ "alt+a", () => document.getElementById("EntityFormSubmit")?.click() ] ]);

	return (
		<>
			<Box
				component="form"
				onSubmit={itemsForm.onSubmit(handleAddItemToPurchaseForm)}
				bd="1px solid #dee2e6"
				bg="white"
				className="borderRadiusAll"
			>
				<Box p="sm" fz="sm" fw={600} bg={'#1e40af'} c={'white'} className="boxBackground textColor borderRadiusAll">
					Vendor Purchase Invoice
				</Box>
				<Divider />
				<ScrollArea h={containerHeight} bg={'#f0f4f83d'} type="never">
					<Box p="sm">
						<InputForm
							form={itemsForm}
							name="barcode"
							id="barcode"
							label=""
							placeholder="Barcode"
							required={false}
							tooltip=""
							leftSection={<IconBarcode size={16} opacity={0.6} />}
						/>
						<Select
							mt="xs"
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
						<Flex mt="md" gap="4" align="flex-end" bg={'#1e40af'} p={'xs'} ml={'-xs'} mr={'-xs'} >
							<Box w="100%">
								<FormValidationWrapper
									errorMessage="Product is required"
									opened={!!itemsForm.errors.productId}
								>
									<Box pos="relative">
										<VirtualSearchSelect
											key={productResetKey}
											value={itemsForm.values.productId}
											options={productOptions}
											placeholder="Choose Product"
											searchable
											nothingFoundMessage="Change the search term to find a product"
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

							<Grid.Col span={12}>
								<InputNumberForm
									form={itemsForm}
									name="quantity"
									id="quantity"
									label="Quantity"
									placeholder="0"
									nextField="purchase_price"
									required={false}
									value={1}
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
									name="purchase_price"
									id="purchase_price"
									label="Purchase Price"
									nextField="expired_date"
									placeholder="0.00"
									tooltip={itemsForm.errors.purchase_price}
									leftSection={<IconCurrencyTaka size={16} opacity={0.6} />}
								/>
							</Grid.Col>
							<Grid.Col span={12}>
								<DateInputForm
									label="Expired Date"
									form={itemsForm}
									name="expired_date"
									id="expired_date"
									placeholder="DD-MM-YYYY"
									valueFormat="DD-MM-YYYY"
									nextField="EntityFormSubmit"
									clearable
									tooltip={itemsForm.errors.expired_date}
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
					<Text fz="sm" fw={500} c={'white'}>
						Sub Total
					</Text>
					<Flex align="center" gap="4" pr={'md'}>
						<Text fz="sm" c={'white'} fw={500}>
							{currencySymbol}
						</Text>
						<Text fz="sm" fw={600} c={'white'}>
							{formatCurrency(invoiceSubTotal)}
						</Text>
					</Flex>
				</Flex>

				<Flex p="sm" justify="space-between" align="center" bg={"#fffbeb85"}>
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
				setStockProductRestore={() => { }}
				focusField="productId"
				fieldPrefix=""
			/>
		</>
	);
}
