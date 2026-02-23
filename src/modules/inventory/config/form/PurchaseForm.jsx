import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetDropdownDataQuery, useGetInventorySettingsQuery } from "@services/settings";
import { Box, Grid, ScrollArea, Button, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { useHotkeys } from "@mantine/hooks";
import SelectForm from "@components/form-builders/SelectForm";
import InputCheckboxForm from "@components/form-builders/InputCheckboxForm";
import { showNotification } from "@components/ShowNotificationComponent";
import useConfigData from "@hooks/useConfigData.js";
import { getPurchaseFormData } from "../helpers/request";
import { forceBooleanToInt } from "@utils/index";
import { useUpdatePurchaseConfigMutation } from "@services/core/purchase";

const BOOLEAN_FIELDS = [
	"search_by_vendor",
	"search_by_product_nature",
	"search_by_category",
	"is_barcode",
	"is_measurement_enable",
	"is_purchase_auto_approved",
	"is_bonus_quantity",
	"is_purchase_by_purchase_price",
	"item_percent",
	"is_warehouse",
];

const PurchaseForm = ({ height }) => {
	const { t } = useTranslation();
	const form = useForm(getPurchaseFormData());
	const { configData } = useConfigData();
	const [updatePurchaseConfig] = useUpdatePurchaseConfigMutation();
	const [purchaseModeData, setPurchaseModeData] = useState(null);
	const { data: vendorGroupData } = useGetDropdownDataQuery({ "dropdown-type": "vendor-group" });
	const { data: productNatureData } = useGetInventorySettingsQuery({
		"dropdown-type": "product-type",
	});

	const config_purchase = configData?.config_purchase;
	const domainId = configData?.id;

	useEffect(() => {
		if (!config_purchase) return;

		const parsedNature = Array.isArray(config_purchase.purchase_product_nature)
			? config_purchase.purchase_product_nature
			: JSON.parse(config_purchase.purchase_product_nature || "[]");

		const natureValues = {};
		parsedNature.forEach((nature) => {
			const natureId = Number(nature);
			natureValues[`${natureId}_purchaseProductNature`] =
				config_purchase?.purchase_product_nature?.includes(natureId) ? 1 : 0;
		});

		setPurchaseModeData(config_purchase?.purchase_mode?.toString());

		form.setValues({
			...{
				search_by_vendor: config_purchase.search_by_vendor || 0,
				search_by_product_nature: config_purchase.search_by_product_nature || 0,
				search_by_category: config_purchase.search_by_category || 0,
				is_barcode: config_purchase.is_barcode || 0,
				is_measurement_enable: config_purchase.is_measurement_enable || 0,
				is_purchase_auto_approved: config_purchase.is_purchase_auto_approved || 0,
				default_vendor_group_id: config_purchase.default_vendor_group_id?.toString() || null,
				purchase_mode: config_purchase.purchase_mode || null,
				is_warehouse: config_purchase.is_warehouse || 0,
				is_bonus_quantity: config_purchase.is_bonus_quantity || 0,
				is_purchase_by_purchase_price: config_purchase.is_purchase_by_purchase_price || 0,
				item_percent: config_purchase.item_percent || 0,
			},
			...natureValues,
		});
	}, [config_purchase]);

	const handlePurchaseFormSubmit = (values) => {
		modals.openConfirmModal({
			title: <Text size="md">{t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
			labels: { confirm: t("Submit"), cancel: t("Cancel") },
			confirmProps: { color: "red" },
			onCancel: () => {},
			onConfirm: () => handlePurchaseConfirmSubmit(values),
		});
	};

	const handlePurchaseConfirmSubmit = async (values) => {
		BOOLEAN_FIELDS.forEach((key) => {
			values[key] = forceBooleanToInt(values[key]);
		});

		const selectedProductNature = Object.entries(values)
			.filter(([key, value]) => value === 1 && key.endsWith("_purchaseProductNature"))
			.map(([key]) => Number(key.split("_")[0]));

		values.purchase_product_nature = selectedProductNature;

		try {
			const result = await updatePurchaseConfig({ ...values, domain_id: domainId }).unwrap();

			if (result.data) {
				showNotification(t("UpdateSuccessfully"), "teal");
			} else {
				showNotification(t("UpdateFailed"), "red", result.message);
			}
		} catch (error) {
			console.error(error);
			showNotification(t("UpdateFailed"), "red", error.message);
		}
	};

	useHotkeys([["alt+p", () => document.getElementById("PurchaseFormSubmit")?.click()]], []);

	const renderProductNatureCheckboxes = () => (
		<>
			{productNatureData?.data?.map((productNature) => (
				<Box key={`${productNature.id}_purchaseProductNature`}>
					<InputCheckboxForm
						form={form}
						label={productNature.name}
						field={`${productNature.id}_purchaseProductNature`}
						name={`${productNature.id}_purchaseProductNature`}
						value={productNature.id}
					/>
				</Box>
			))}
		</>
	);

	return (
		<ScrollArea h={height} scrollbarSize={2} scrollbars="y" type="never">
			<form onSubmit={form.onSubmit(handlePurchaseFormSubmit)}>
				<Box pt="xs">
					{/* Purchase mode Selection */}
					<Grid columns={24} gutter={{ base: 1 }}>
						<Grid.Col span={12} fz="sm" mt={8} pl="xs">
							<Text fw={500}>{t("PurchaseMode")}</Text>
						</Grid.Col>
						<Grid.Col span={11}>
							<SelectForm
								tooltip={t("ChoosePurchaseMode")}
								label=""
								placeholder={t("ChoosePurchaseMode")}
								required={true}
								name="purchase_mode"
								form={form}
								dropdownValue={[
									{ value: "purchase-price", label: t("PurchasePrice") },
									{ value: "mrp-price", label: t("MrpPrice") },
									{ value: "split-amount", label: t("SplitAmount") },
								]}
								id="purchase_mode"
								searchable={false}
								value={purchaseModeData}
								changeValue={setPurchaseModeData}
							/>
						</Grid.Col>
					</Grid>

					{/* Vendor Group Selection */}
					<Grid columns={24} gutter={{ base: 1 }} mt={8}>
						<Grid.Col span={12} fz="sm" mt={8} pl="xs">
							<Text fw={500}>{t("VendorGroup")}</Text>
						</Grid.Col>
						<Grid.Col span={11}>
							<SelectForm
								tooltip={t("ChooseVendorGroup")}
								label=""
								placeholder={t("ChooseVendorGroup")}
								required={true}
								name="default_vendor_group_id"
								form={form}
								dropdownValue={vendorGroupData?.data?.map((item) => ({
									value: String(item.id),
									label: item.name,
								}))}
								id="default_vendor_group_id"
							/>
						</Grid.Col>
					</Grid>

					{/* Product Nature */}
					<Box bg="gray.1" px="sm" py="xs" mt="xs">
						<Text component="h2" aria-label="Product Purchase Nature" fz={14} fw={600}>
							{t("ProductPurchaseNature")}
						</Text>
					</Box>

					<Box pl="sm">{productNatureData?.data && renderProductNatureCheckboxes()}</Box>

					{/* Purchase Settings */}
					<Box bg="gray.1" px="sm" py="xs" mt="xs">
						<Text component="h2" aria-label="Purchase Settings" fz={14} fw={600}>
							{t("PurchaseSettings")}
						</Text>
					</Box>
					<Box pl="sm">
						<InputCheckboxForm
							form={form}
							label={t("PurchaseByPurchasePrice")}
							field="is_purchase_by_purchase_price"
							name="is_purchase_by_purchase_price"
						/>
						<InputCheckboxForm
							form={form}
							label={t("PurchaseAutoApproved")}
							field="is_purchase_auto_approved"
							name="is_purchase_auto_approved"
						/>
						<InputCheckboxForm
							form={form}
							label={t("BonusQuantity")}
							field="is_bonus_quantity"
							name="is_bonus_quantity"
						/>
						<InputCheckboxForm
							form={form}
							label={t("ItemPercent")}
							field="item_percent"
							name="item_percent"
						/>
					</Box>

					{/* Product & Configuration */}
					<Box bg="gray.1" px="sm" py="xs" mt="xs">
						<Text component="h2" aria-label="Product & Configuration" fz={14} fw={600}>
							{t("ProductConfiguration")}
						</Text>
					</Box>
					<Box pl="sm">
						<InputCheckboxForm
							form={form}
							label={t("IsBarcode")}
							field="is_barcode"
							name="is_barcode"
						/>
						<InputCheckboxForm
							form={form}
							label={t("MeasurementEnabled")}
							field="is_measurement_enable"
							name="is_measurement_enable"
						/>
					</Box>

					{/* Search & Filtering */}
					<Box bg="gray.1" px="sm" py="xs" mt="xs">
						<Text component="h2" aria-label="Search & Filtering Settings" fz={14} fw={600}>
							{t("SearchAndFiltering")}
						</Text>
					</Box>
					<Box pl="sm">
						<InputCheckboxForm
							form={form}
							label={t("SearchByVendor")}
							field="search_by_vendor"
							name="search_by_vendor"
						/>
						<InputCheckboxForm
							form={form}
							label={t("SearchByProductNature")}
							field="search_by_product_nature"
							name="search_by_product_nature"
						/>
						<InputCheckboxForm
							form={form}
							label={t("SearchByCategory")}
							field="search_by_category"
							name="search_by_category"
						/>
					</Box>

					{/* Inventory & Storage */}
					<Box bg="gray.1" px="sm" py="xs" mt="xs">
						<Text component="h2" aria-label="Inventory & Storage Settings" fz={14} fw={600}>
							{t("InventoryAndStorage")}
						</Text>
					</Box>
					<Box pl="sm">
						<InputCheckboxForm
							form={form}
							label={t("Warehouse")}
							field="is_warehouse"
							name="is_warehouse"
						/>
					</Box>
				</Box>

				{/* Hidden Button for hotkey triggering */}
				<Button id="PurchaseFormSubmit" type="submit" style={{ display: "none" }}>
					{t("Submit")}
				</Button>
			</form>
		</ScrollArea>
	);
};

export default PurchaseForm;
