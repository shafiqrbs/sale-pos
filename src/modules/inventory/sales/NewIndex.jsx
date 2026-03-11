import React, { useRef, useState } from "react";
import { Box, Flex, Text } from "@mantine/core";
import { useForm } from "@mantine/form";

import InvoiceForm from "./form/InvoiceForm";
import SalesOverview from "./Overview";
import { salesOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempSalesProducts from "@hooks/useTempSalesProducts";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useConfigData from "@hooks/useConfigData";
import { generateInvoiceId, formatDateTime } from "@utils/index";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";

export default function NewIndex() {
	const { t } = useTranslation();
	const { user } = useLoggedInUser();
	const { configData } = useConfigData();
	const salesForm = useForm(salesOverviewRequest());
	const { salesProducts, refetch } = useTempSalesProducts({ type: "sales" });
	const [resetKey, setResetKey] = useState(0);
	const [isAddingSales, setIsAddingSales] = useState(false);

	// =============== tracks whether the submit was triggered via POS Print ===============
	const withPosPrintRef = useRef(false);

	// =============== update product quantities and sales after successful sale (same as POS Transaction) ===============
	const updateProductsAfterSale = async () => {
		try {
			for (const cartItem of salesProducts) {
				const productId = cartItem.product_id;
				const currentProduct = await window.dbAPI.getDataFromTable("core_products", {
					id: productId,
				});
				const currentProductData = Array.isArray(currentProduct)
					? currentProduct[0]
					: currentProduct;

				if (!currentProductData) {
					console.error(`Product not found in database: ${productId}`);
					continue;
				}

				const soldQuantity = Number(cartItem.quantity) || 0;
				const newQuantity = (currentProductData.quantity || 0) - soldQuantity;
				const newTotalSales = (currentProductData.total_sales || 0) + soldQuantity;

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: productId },
					data: {
						quantity: newQuantity,
						total_sales: newTotalSales,
					},
				});
			}
			window.dispatchEvent(new CustomEvent("products-updated"));
		} catch (error) {
			console.error("Error updating products after sale:", error);
		}
	};

	const handleSubmit = async (formValues) => {
		if (!salesProducts?.length) {
			showNotification("Add minimum one sales item first", "red");
			return;
		}

		const payments = formValues.payments ?? [];
		if (!payments.length) {
			showNotification("Transaction mode is required", "red");
			return;
		}

		if (!formValues.paymentAmount || Number(formValues.paymentAmount) <= 0) {
			showNotification("Payment amount is required", "red");
			return;
		}

		const subTotal = salesProducts.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
			0
		);

		const discountValue =
			formValues.discount_type === "coupon" ? 0 : Number(formValues.discount) || 0;

		const vat = 0;
		const grandTotal = Math.max(subTotal - discountValue + vat, 0);
		const fullAmount = Number(formValues.paymentAmount) || 0;
		const isSplitPaymentActive = payments.length > 1;
		const modeName = isSplitPaymentActive ? "Multiple" : (payments[0]?.transaction_mode_name ?? "");

		// =============== get customer info from database ===============
		let customerName = "";
		let customerMobile = "";
		let customerAddress = "";
		if (formValues.customer_id) {
			const customers = await window.dbAPI.getDataFromTable("core_customers", {
				id: formValues.customer_id,
			});
			const customerData = Array.isArray(customers) ? customers[0] : customers;
			if (customerData) {
				customerName = customerData.name ?? "";
				customerMobile = customerData.mobile ?? "";
				customerAddress = customerData.address ?? "";
			}
		}

		const invoiceId = generateInvoiceId();
        const salesItemsForDb = salesProducts.map((item) => ({
            product_id: item.product_id,
            display_name: item.display_name,
            quantity: Number(item.quantity) || 0,
            mrp: Number(item.mrp ?? item.price ?? item.sales_price) || 0,
            sales_price: Number(item.sales_price) || 0,
            sub_total: (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
            category_id: item.category_id ?? null,
            category_name: item.category_name ?? "",
        }));

		const salesData = {
			invoice: invoiceId,
			sub_total: subTotal,
			total: Math.round(grandTotal),
			approved_by_id: user?.id ?? null,
			payment: fullAmount,
			discount: discountValue,
			discount_calculation: discountValue,
			discount_type:
				formValues.discount_type === "flat"
					? "Flat"
					: formValues.discount_type === "percentage"
						? "Percentage"
						: "Coupon",
			customerId: formValues.customer_id ?? null,
			customerName,
			customerMobile,
			customer_address: customerAddress,
			createdByUser: user?.username ?? "",
			createdById: user?.id ?? null,
			salesById: user?.id ?? null,
			salesByUser: user?.username ?? "",
			salesByName: user?.name ?? "",
			process: "approved",
			mode_name: modeName,
			created: formatDateTime(new Date()),
			sales_items: JSON.stringify(salesItemsForDb),
			multi_transaction: isSplitPaymentActive ? 1 : 0,
			payments: JSON.stringify(payments),
		};

		setIsAddingSales(true);
		try {
			await window.dbAPI.upsertIntoTable("sales", salesData);
			await updateProductsAfterSale();

			const shouldPrint = withPosPrintRef.current;

			showNotification("Sale added successfully", "teal");

			await window.dbAPI.deleteDataFromTable("temp_sales_products", { type: "sales" });
			refetch();
			salesForm.reset();
			setResetKey((previousKey) => previousKey + 1);

			if (shouldPrint && window.deviceAPI?.thermalPrint) {
				const setup = await window.dbAPI.getDataFromTable("printer");
				if (setup?.printer_name) {
					await window.deviceAPI.thermalPrint({
						configData: { ...configData, user },
						salesItems: salesItemsForDb,
						salesViewData: salesData,
						setup,
					});
				} else {
					showNotification(t("PrinterNotSetup"), "red");
				}
			}
		} catch (error) {
			console.error(error);
			showNotification(error?.message || "Failed to save sale", "red");
		} finally {
			setIsAddingSales(false);
			withPosPrintRef.current = false;
		}
	};

	const handlePosPrint = () => {
		withPosPrintRef.current = true;
		// =============== trigger salesForm submission with POS print flag set ===============
		salesForm.onSubmit(handleSubmit)();
	};

	const handleReset = async () => {
		await window.dbAPI.deleteDataFromTable("temp_sales_products", { type: "sales" });
		refetch();
		salesForm.reset();
		setResetKey((previousKey) => previousKey + 1);
	};

	return (
		<Box>
			{/* <Flex justify="space-between" align="center" mb="4xs">
                <Box px="xs" fz="sm" fw={600} className="boxBackground textColor borderRadiusAll">
                    {t("SalesItems")}
                </Box>

                <Flex gap="sm">
                    <NavLink to="/">
                        <Text>
                            {t("Sales")}
                        </Text>
                    </NavLink>
                    <NavLink to="/">
                        <Text>
                            {t("Hold")}
                        </Text>
                    </NavLink>
                    <NavLink to="/">
                        <Text>
                            {t("Stock")}
                        </Text>
                    </NavLink>
                    <NavLink to="/">
                        <Text>
                            {t("Instant")}
                        </Text>
                    </NavLink>
                </Flex>
            </Flex>*/}
			<Box p="xs" pb={0}>
				<InvoiceForm refetch={refetch} />
			</Box>
			<Box component="form" id="salesForm" onSubmit={salesForm.onSubmit(handleSubmit)}>
				<SalesOverview
					isAddingSales={isAddingSales}
					salesForm={salesForm}
					salesProducts={salesProducts}
					refetch={refetch}
					onPosPrint={handlePosPrint}
					onReset={handleReset}
					resetKey={resetKey}
				/>
			</Box>
		</Box>
	);
}
