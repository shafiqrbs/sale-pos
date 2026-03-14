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
	IconShoppingCart, IconSortAscendingNumbers, IconUserPlus,
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
import SelectForm from "@components/form-builders/SelectForm";
import {useGetVendorsQuery} from "@services/core/vendors";
import {useTranslation} from "react-i18next";

export default function InvoiceForm({ refetch, onAddItem }) {

	const { t } = useTranslation();
	const [ products, setProducts ] = useState([]);
	const [ productResetKey, setProductResetKey ] = useState(0);
	const [ selectedCategoryId, setSelectedCategoryId ] = useState(null);
	const { configData } = useConfigData();
	const itemsForm = useForm(invoiceItemFormRequest());
	const { getLocalProducts } = useLocalProducts({
		fetchOnMount: false,
	});
	const { categories } = useGetCategories();
	const { data: vendors } = useGetVendorsQuery();

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

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const productOptions = products?.map((product) => ({
		value: String(product.id),
		label: `${product.display_name} [${product.quantity}] ${product.unit_name} - ${currencySymbol}${product.purchase_price}`,
		purchase_price: product.purchase_price,
		unit: product.unit_name,
	}));

	const containerHeight = mainAreaHeight - 120;

	const handleAddItemToPurchaseForm = async () => {
		const { productId, purchasePrice, quantity, expired_date } = itemsForm.values;

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
		(Number(itemsForm.values.purchasePrice) || 0);

	const handleResetInvoiceItemForm = () => {
		itemsForm.reset();
		setProductResetKey((prev) => prev + 1);
		requestAnimationFrame(() => {
			document.getElementById("productId")?.open?.();
		});
	};

	const handleProductSelect = (value, option) => {
		itemsForm.setFieldValue("productId", value);
		itemsForm.setFieldValue("purchasePrice", option?.purchase_price);
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
				<Box p="sm" fz="sm" fw={600} bg={'var(--theme-primary-color-8)'} c={'white'} className="boxBackground textColor borderRadiusAll">
					{t("PurchaseReturn")}
				</Box>
				<Divider />
				<ScrollArea h={containerHeight} bg={'#f0f4f83d'} type="never">
					<Box p="sm">
						<Flex mt="md" gap="4" align="flex-end" bg={'var(--theme-primary-color-4)'} p={'xs'} ml={'-xs'} mr={'-xs'} >
							<Box w="100%">
								<Select
									name="return_mode"
									form={itemsForm}
									data={['Requisition', 'General']}
									nextField="invoice_date"
									placeholder="Search Return Mode"
									tooltip="Return mode is required"
								/>
							</Box>
						</Flex>
						<Flex mt="md" gap="4" align="flex-end" bg={'var(--theme-primary-color-2)'} p={'xs'} ml={'-xs'} mr={'-xs'} >
							<Box w="100%">
								<SelectForm
									name="vendor_id"
									form={itemsForm}
									dropdownValue={vendors?.data?.map((vendor) => ({
										value: String(vendor.id),
										label: vendor.name,
									}))}
									placeholder="Search vendor/supplier"
									tooltip="Vendor is required"
								/>
							</Box>
						</Flex>
						<Flex mt="md" gap="4" align="flex-end" bg={'var(--theme-primary-color-6)'} p={'xs'} ml={'-xs'} mr={'-xs'} >
							<Box w="100%">
								<Select
									placeholder="Select Vendor/Supplier"
									data={[
										{ value: "", label: "Select GRN No" },
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
						</Flex>
					</Box>
				</ScrollArea>
				<Flex p="sm" justify="space-between" align="center" bg={"#fffbeb85"}>
					<Button
						fullWidth
						leftSection={<IconPlus size={18} />}
						bg="var(--theme-primary-color-6)"
						color="white"
						radius="sm"
						type="submit"
						id="EntityFormSubmit"
					>
						Add All
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
