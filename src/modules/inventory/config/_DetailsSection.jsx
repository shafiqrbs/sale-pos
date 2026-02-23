import { Box, Title, ScrollArea, Grid } from "@mantine/core";
import { useTranslation } from "react-i18next";
import React from "react";
import scrollbar from "@assets/css/Scrollbar.module.css";

// =============== single label: value row used across all sections ===============
function DetailRow({ label, value, asBoolean, fallback = null }) {
	const { t } = useTranslation();
	const displayValue = asBoolean ? (value ? t("Yes") : t("No")) : (value ?? fallback ?? "");
	return (
		<Grid columns={24}>
			<Grid.Col span={9} align="left" fw="300" fz="xs">
				{label}
			</Grid.Col>
			<Grid.Col span={1}>:</Grid.Col>
			<Grid.Col span={14}>{displayValue}</Grid.Col>
		</Grid>
	);
}

// =============== section header with gray background ===============
function SectionHeader({ titleKey }) {
	const { t } = useTranslation();
	return (
		<Box ml="-md" pl="md" p="xs" mb="xs" ta="left" bg="gray.1">
			<Title order={6} pt="4">
				{t(titleKey)}
			</Title>
		</Box>
	);
}

// =============== render multiple rows from config list (labelKey, getValue, options) ===============
function DetailRows({ items, getValue }) {
	const { t } = useTranslation();
	return (
		<>
			{items.map((item) => (
				<DetailRow
					key={item.labelKey}
					label={t(item.labelKey)}
					value={getValue(item.valueKey)}
					asBoolean={item.asBoolean}
					fallback={item.fallback}
				/>
			))}
		</>
	);
}

export default function DetailsSection({ data, height }) {
	const { t } = useTranslation();

	const productConfig = data?.config_product;
	const salesConfig = data?.config_sales;
	const purchaseConfig = data?.config_purchase;
	const discountConfig = data?.config_discount;
	const accountConfig = data?.account_config;

	// =============== basic domain rows ===============
	const basicRows = [
		{ labelKey: "Name", valueKey: "name" },
		{ labelKey: "Mobile", valueKey: "mobile" },
		{ labelKey: "Email", valueKey: "email" },
		{ labelKey: "Address", valueKey: "address" },
		{ labelKey: "UniqueCode", valueKey: "unique_code" },
	];
	const getBasic = (key) =>
		key === "status" ? (data?.status === 1 ? t("Active") : t("Inactive")) : data?.[key];

	// =============== product config rows: mix of boolean and optional text ===============
	const productRows = productConfig
		? [
				{ labelKey: "Brand", valueKey: "is_brand", asBoolean: true },
				{ labelKey: "Color", valueKey: "is_color", asBoolean: true },
				{ labelKey: "Size", valueKey: "is_size", asBoolean: true },
				{ labelKey: "Grade", valueKey: "is_grade", asBoolean: true },
				{ labelKey: "Model", valueKey: "is_model", asBoolean: true },
				{ labelKey: "MultiPrice", valueKey: "is_multi_price", asBoolean: true },
				{ labelKey: "Measurement", valueKey: "is_measurement", asBoolean: true },
				{ labelKey: "ProductGallery", valueKey: "is_product_gallery", asBoolean: true },
				{ labelKey: "SKU", valueKey: "is_sku", asBoolean: true },
				{ labelKey: "BarcodeBrand", valueKey: "barcode_brand", asBoolean: true },
				{ labelKey: "BarcodeColor", valueKey: "barcode_color", asBoolean: true },
				{ labelKey: "BarcodeSize", valueKey: "barcode_size", asBoolean: true },
				{ labelKey: "BarcodePrint", valueKey: "barcode_print", asBoolean: true },
				{ labelKey: "BarcodePriceHide", valueKey: "barcode_price_hide", asBoolean: true },
				{ labelKey: "SKUCategory", valueKey: "sku_category", asBoolean: true },
				{ labelKey: "SKUBrand", valueKey: "sku_brand", asBoolean: true },
				{ labelKey: "SKUModel", valueKey: "sku_model", asBoolean: true },
				{ labelKey: "SKUColor", valueKey: "sku_color", asBoolean: true },
				{ labelKey: "SKUSize", valueKey: "sku_size", asBoolean: true },
				{ labelKey: "SKUWarehouse", valueKey: "sku_warehouse", asBoolean: true },
			]
		: [];

	const getProduct = (key) => productConfig?.[key];

	// =============== sales config rows ===============
	const salesRows = salesConfig
		? [
				{
					labelKey: "DefaultCustomerGroup",
					valueKey: "default_customer_group.name",
					fallback: "-",
				},
				{ labelKey: "SearchByCategory", valueKey: "search_by_category", asBoolean: true },
				{ labelKey: "SearchByVendor", valueKey: "search_by_vendor", asBoolean: true },
				{
					labelKey: "SearchByProductNature",
					valueKey: "search_by_product_nature",
					asBoolean: true,
				},
				{ labelKey: "SearchByWarehouse", valueKey: "search_by_warehouse", asBoolean: true },
				{ labelKey: "ShowProduct", valueKey: "show_product", asBoolean: true },
				{ labelKey: "ZeroStock", valueKey: "zero_stock", asBoolean: true },
				{ labelKey: "MeasurementEnable", valueKey: "is_measurement_enable", asBoolean: true },
				{ labelKey: "ZeroReceiveAllow", valueKey: "is_zero_receive_allow", asBoolean: true },
				{
					labelKey: "DueSalesWithoutCustomer",
					valueKey: "due_sales_without_customer",
					asBoolean: true,
				},
				{ labelKey: "ItemSalesPercent", valueKey: "item_sales_percent", asBoolean: true },
				{ labelKey: "MultiPrice", valueKey: "is_multi_price", asBoolean: true },
				{ labelKey: "SalesAutoApproved", valueKey: "is_sales_auto_approved", asBoolean: true },
				{ labelKey: "DiscountWithCustomer", valueKey: "discount_with_customer", asBoolean: true },
			]
		: [];

	const getNested = (config, path) => {
		const keys = path.split(".");

		let value = config;
		for (const key of keys) value = value?.[key];

		return value;
	};

	const getSales = (key) => getNested(salesConfig, key);

	// =============== purchase config rows ===============
	const purchaseRows = purchaseConfig
		? [
				{ labelKey: "DefaultVendorGroup", valueKey: "default_vendor_group.name", fallback: "-" },
				{ labelKey: "SearchByVendor", valueKey: "search_by_vendor", asBoolean: true },
				{
					labelKey: "SearchByProductNature",
					valueKey: "search_by_product_nature",
					asBoolean: true,
				},
				{ labelKey: "SearchByCategory", valueKey: "search_by_category", asBoolean: true },
				{ labelKey: "SearchByWarehouse", valueKey: "search_by_warehouse", asBoolean: true },
				{ labelKey: "ShowProduct", valueKey: "show_product", asBoolean: true },
				{ labelKey: "MeasurementEnable", valueKey: "is_measurement_enable", asBoolean: true },
				{
					labelKey: "PurchaseAutoApproved",
					valueKey: "is_purchase_auto_approved",
					asBoolean: true,
				},
			]
		: [];

	const getPurchase = (key) => getNested(purchaseConfig, key);

	// =============== production config rows ===============
	const productionRows = data?.production_config
		? [
				{ labelKey: "Warehouse", valueKey: "is_warehouse", asBoolean: true },
				{ labelKey: "Measurement", valueKey: "is_measurement", asBoolean: true },
				{ labelKey: "IssueWithWarehouse", valueKey: "issue_with_warehouse", asBoolean: true },
				{
					labelKey: "IssueByProductionBatch",
					valueKey: "issue_by_production_batch",
					asBoolean: true,
				},
			]
		: [];

	const getProduction = (key) => data?.production_config?.[key];

	// =============== discount config rows ===============
	const discountRows = discountConfig
		? [
				{ labelKey: "Name", valueKey: "name", fallback: "-" },
				{ labelKey: "MaxDiscount", valueKey: "max_discount", fallback: "-" },
				{ labelKey: "DiscountWithCustomer", valueKey: "discount_with_customer", asBoolean: true },
			]
		: [];

	const getDiscount = (key) => discountConfig?.[key];

	// =============== account config rows (all optional text with fallback) ===============
	const accountRows = accountConfig
		? [
				{ labelKey: "FinancialStartDate", valueKey: "financial_start_date", fallback: "-" },
				{ labelKey: "FinancialEndDate", valueKey: "financial_end_date", fallback: "-" },
				{ labelKey: "AccountBank", valueKey: "account_bank.name", fallback: "-" },
				{ labelKey: "AccountCash", valueKey: "account_cash.name", fallback: "-" },
				{ labelKey: "AccountCategory", valueKey: "account_category.name", fallback: "-" },
				{ labelKey: "AccountCustomer", valueKey: "account_customer.name", fallback: "-" },
				{ labelKey: "AccountMobile", valueKey: "account_mobile.name", fallback: "-" },
				{ labelKey: "AccountProductGroup", valueKey: "account_product_group.name", fallback: "-" },
				{ labelKey: "AccountUser", valueKey: "account_user.name", fallback: "-" },
				{ labelKey: "AccountVendor", valueKey: "account_vendor.name", fallback: "-" },
				{ labelKey: "VoucherPurchase", valueKey: "voucher_purchase.name", fallback: "-" },
				{
					labelKey: "VoucherPurchaseReturn",
					valueKey: "voucher_purchase_return.name",
					fallback: "-",
				},
				{ labelKey: "VoucherSales", valueKey: "voucher_sales.name", fallback: "-" },
				{ labelKey: "VoucherSalesReturn", valueKey: "voucher_sales_return.name", fallback: "-" },
				{ labelKey: "VoucherStockOpening", valueKey: "voucher_stock_opening.name", fallback: "-" },
				{
					labelKey: "VoucherStockReconciliation",
					valueKey: "voucher_stock_reconciliation.name",
					fallback: "-",
				},
			]
		: [];

	const getAccount = (key) => getNested(accountConfig, key);

	return (
		<Box bg="white" p="xs" className="borderRadiusAll">
			<Box
				h={48}
				pl="xs"
				pr={8}
				bg="gray.1"
				pt="xs"
				mb="6"
				className="boxBackground borderRadiusAll"
			>
				<Title order={6} pt="4">
					{t("DomainDetails")}
				</Title>
			</Box>
			<Box className="borderRadiusAll" h={height}>
				<ScrollArea h={height} scrollbarSize={2} classNames={scrollbar}>
					<Box p="md">
						{basicRows.map((row) => (
							<DetailRow
								key={row.labelKey}
								label={t(row.labelKey)}
								value={getBasic(row.valueKey)}
							/>
						))}
						<DetailRow label={t("Status")} value={getBasic("status")} />

						{productConfig && (
							<>
								<SectionHeader titleKey="ProductConfiguration" />
								<DetailRows items={productRows} getValue={getProduct} />
							</>
						)}

						{salesConfig && (
							<>
								<SectionHeader titleKey="SalesConfiguration" />
								<DetailRows items={salesRows} getValue={getSales} />
							</>
						)}

						{purchaseConfig && (
							<>
								<SectionHeader titleKey="PurchaseConfiguration" />
								<DetailRows items={purchaseRows} getValue={getPurchase} />
							</>
						)}

						{data?.production_config && (
							<>
								<SectionHeader titleKey="ProductionConfiguration" />
								<DetailRows items={productionRows} getValue={getProduction} />
							</>
						)}

						{discountConfig && (
							<>
								<SectionHeader titleKey="DiscountConfiguration" />
								<DetailRows items={discountRows} getValue={getDiscount} />
							</>
						)}

						{accountConfig && (
							<>
								<SectionHeader titleKey="AccountingConfiguration" />
								<DetailRows items={accountRows} getValue={getAccount} />
							</>
						)}
					</Box>
				</ScrollArea>
			</Box>
		</Box>
	);
}
