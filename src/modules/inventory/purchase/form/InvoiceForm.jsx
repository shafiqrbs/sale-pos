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
import { useDisclosure } from "@mantine/hooks";
import { formatCurrency } from "@utils/index";
import { showNotification } from "@components/ShowNotificationComponent";
import { invoiceItemFormRequest } from "../helpers/request";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import { useState } from "react";

export default function InvoiceForm({ purchaseForm }) {
	const [productResetKey, setProductResetKey] = useState(0);
	const { configData } = useConfigData();
	const { products } = useLocalProducts();
	const { mainAreaHeight } = useMainAreaHeight();
	const [isProductDrawerOpened, { open: openProductDrawer, close: closeProductDrawer }] =
		useDisclosure(false);

	const invoiceItemForm = useForm(invoiceItemFormRequest());

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;
	const productOptions = products?.map((product) => ({
		value: String(product.id),
		label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.purchase_price}`,
		purchase_price: product.purchase_price,
	}));

	const containerHeight = mainAreaHeight - 170;

	const handleAddItemToPurchaseForm = () => {
		const { productId, purchasePrice, quantity } = invoiceItemForm.values;

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
			id: crypto.randomUUID(),
			productId: String(selectedProduct.id),
			productName: selectedProduct.display_name,
			quantity: quantityNumber,
			price: priceNumber,
		};

		// =============== push new item into main purchase form list using mantine helpers ===============
		purchaseForm.insertListItem("items", newItem);

		handleResetInvoiceItemForm();
		showNotification("Item added successfully", "teal");
	};

	const invoiceSubTotal =
		(Number(invoiceItemForm.values.quantity) || 0) *
		(Number(invoiceItemForm.values.purchasePrice) || 0);

	const handleResetInvoiceItemForm = () => {
		invoiceItemForm.reset();
		setProductResetKey((prev) => prev + 1);
	};

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

						<Flex mt="4xs" gap="4" align="flex-end">
							<Box style={{ flex: 1 }}>
								<FormValidationWrapper
									errorMessage="Product is required"
									opened={!!invoiceItemForm.errors.productId}
								>
									<Select
										key={productResetKey}
										placeholder="Choose Product"
										data={productOptions}
										searchable
										{...invoiceItemForm.getInputProps("productId", { type: "search" })}
										onChange={(value, option) => {
											invoiceItemForm.setFieldValue("productId", value);
											invoiceItemForm.setFieldValue("purchasePrice", option?.purchase_price);
										}}
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
									placeholder="Quantity"
									required={false}
									tooltip={invoiceItemForm.errors.quantity}
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
						id="InvoiceFormSubmit"
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
