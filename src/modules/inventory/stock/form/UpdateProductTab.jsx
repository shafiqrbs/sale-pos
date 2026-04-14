import { useEffect, useMemo } from "react";
import { Box, Button, Divider, Grid, ScrollArea, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { IconDeviceFloppy } from "@tabler/icons-react";
import {
	useGetInventoryParticularQuery,
	useGetInventorySettingsQuery,
} from "@services/settings.js";
import useGetCategories from "@hooks/useGetCategories";
import { useUpdateProductMutation } from "@services/product.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import SelectForm from "@components/form-builders/SelectForm.jsx";
import InputForm from "@components/form-builders/InputForm.jsx";
import InputNumberForm from "@components/form-builders/InputNumberForm.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

export default function UpdateProductTab({ product, productId }) {
	const { mainAreaHeight } = useMainAreaHeight();
	const { t } = useTranslation();

	const { data: productTypeData } = useGetInventorySettingsQuery({
		"dropdown-type": "product-type",
	});
	const { categories: categoryData } = useGetCategories();
	const { data: productUnitData } = useGetInventoryParticularQuery({
		"dropdown-type": "product-unit",
	});

	const [updateProduct, { isLoading }] = useUpdateProductMutation();

	const form = useForm({
		initialValues: {
			product_type_id: "",
			category_id: "",
			unit_id: "",
			name: "",
			alternative_name: "",
			bangla_name: "",
			barcode: "",
			sku: "",
			min_quantity: "",
			expiry_duration: "",
		},
		validate: {
			product_type_id: (value) =>
				!value || String(value).trim() === "" ? t("ProductTypeRequired") : null,
			category_id: (value) =>
				!value || String(value).trim() === "" ? t("CategoryRequired") : null,
			unit_id: (value) => (!value || String(value).trim() === "" ? t("UnitRequired") : null),
			name: (value) => (!value || String(value).trim() === "" ? t("NameIsRequired") : null),
		},
	});

	// =============== populate form once product data is loaded ================
	useEffect(() => {
		if (!product) return;
		form.setValues({
			product_type_id: product.product_type_id ? String(product.product_type_id) : "",
			category_id: product.category_id ? String(product.category_id) : "",
			unit_id: product.unit_id ? String(product.unit_id) : "",
			name: product.product_name ?? "",
			alternative_name: product.alternative_name ?? "",
			bangla_name: product.bangla_name ?? "",
			barcode: product.barcode ?? "",
			sku: product.sku ?? "",
			min_quantity: product.min_quantity ?? "",
			expiry_duration: product.expiry_duration ?? "",
		});
		form.resetDirty();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [product?.id]);

	const productTypeOptions = useMemo(
		() =>
			productTypeData?.data?.map((item) => ({
				value: String(item.id),
				label: item.name,
			})) ?? [],
		[productTypeData]
	);

	const categoryOptions = useMemo(
		() =>
			categoryData?.map((item) => ({
				value: String(item.id),
				label: item.name,
			})) ?? [],
		[categoryData]
	);

	const unitOptions = useMemo(
		() =>
			productUnitData?.data?.map((item) => ({
				value: String(item.id),
				label: item.name,
			})) ?? [],
		[productUnitData]
	);

	const handleSubmit = async (values) => {
		const body = {
			product_type_id: Number(values.product_type_id),
			category_id: Number(values.category_id),
			unit_id: Number(values.unit_id),
			name: values.name,
			alternative_name: values.alternative_name,
			bangla_name: values.bangla_name,
			barcode: values.barcode,
			sku: values.sku,
			min_quantity: values.min_quantity !== "" ? Number(values.min_quantity) : null,
			expiry_duration: values.expiry_duration !== "" ? Number(values.expiry_duration) : null,
		};

		try {
			const response = await updateProduct({ id: productId, body }).unwrap();
			const isSuccess = response?.status === 200 && response?.message === "success";
			if (!isSuccess) {
				showNotification(response?.message || t("UpdateFailed"), "red");
				return;
			}
			showNotification(t("UpdateSuccessfully"), "teal");
		} catch (error) {
			console.error(error);
			showNotification(error?.data?.message || t("UpdateFailed"), "red");
		}
	};

	return (
		<Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
			<Text fw={600} size="md" mb="xs">
				{t("UpdateProduct")}
			</Text>
			<Divider mb="sm" />

			<ScrollArea h={mainAreaHeight - 146} scrollbars="y" type="hover" scrollbarSize={6}>
				<SelectForm
					tooltip={t("ChooseProductType")}
					label={t("ProductType")}
					placeholder={t("ChooseProductType")}
					required
					name="product_type_id"
					form={form}
					dropdownValue={productTypeOptions}
					id="stock_edit_product_type_id"
					searchable
				/>

				<Box mt="xs">
					<SelectForm
						tooltip={t("ChooseCategory")}
						label={t("Category")}
						placeholder={t("ChooseCategory")}
						required
						name="category_id"
						form={form}
						dropdownValue={categoryOptions}
						id="stock_edit_category_id"
						searchable
					/>
				</Box>

				<Box mt="xs">
					<InputForm
						tooltip={t("ProductNameValidateMessage")}
						label={t("ProductName")}
						placeholder={t("ProductName")}
						required
						form={form}
						name="name"
						id="stock_edit_name"
					/>
				</Box>

				<Box mt="xs">
					<InputForm
						tooltip={t("AlternativeProductName")}
						label={t("AlternativeProductName")}
						placeholder={t("AlternativeProductName")}
						form={form}
						name="alternative_name"
						id="stock_edit_alternative_name"
					/>
				</Box>

				<Box mt="xs">
					<InputForm
						tooltip={t("BanglaName")}
						label={t("BanglaName")}
						placeholder={t("BanglaName")}
						form={form}
						name="bangla_name"
						id="stock_edit_bangla_name"
					/>
				</Box>

				<Box mt="xs">
					<SelectForm
						tooltip={t("ChooseProductUnit")}
						label={t("ProductUnit")}
						placeholder={t("ChooseProductUnit")}
						required
						name="unit_id"
						form={form}
						dropdownValue={unitOptions}
						id="stock_edit_unit_id"
						searchable
					/>
				</Box>

				<Box mt="xs">
					<InputNumberForm
						tooltip={t("ExpiryDurationValidateMessage")}
						label={t("ExpiryDuration")}
						placeholder={t("ExpiryDuration")}
						form={form}
						name="expiry_duration"
						id="stock_edit_expiry_duration"
						min={0}
					/>
				</Box>

				<Box mt="xs">
					<Grid columns={12} gutter={{ base: 6 }}>
						<Grid.Col span={6}>
							<InputForm
								tooltip={t("ProductSkuValidateMessage")}
								label={t("ProductSku")}
								placeholder={t("ProductSku")}
								form={form}
								name="sku"
								id="stock_edit_sku"
							/>
						</Grid.Col>
						<Grid.Col span={6}>
							<InputForm
								tooltip={t("BarcodeValidateMessage")}
								label={t("Barcode")}
								placeholder={t("Barcode")}
								form={form}
								name="barcode"
								id="stock_edit_barcode"
							/>
						</Grid.Col>
					</Grid>
				</Box>

				<Box mt="xs">
					<InputNumberForm
						tooltip={t("MinimumQuantityValidateMessage")}
						label={t("MinimumQuantity")}
						placeholder={t("MinimumQuantity")}
						form={form}
						name="min_quantity"
						id="stock_edit_min_quantity"
						min={0}
					/>
				</Box>
			</ScrollArea>

			<Button
				mt="md"
				type="submit"
				fullWidth
				size="md"
				color="blue"
				loading={isLoading}
				leftSection={<IconDeviceFloppy size={18} />}
			>
				{t("UpdateProduct")}
			</Button>
		</Box>
	);
}
