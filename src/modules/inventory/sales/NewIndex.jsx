import React, { useRef } from "react";
import { Box, Button, Flex, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";

import InvoiceForm from "./form/InvoiceForm";
import SalesOverview from "./Overview";
import { salesOverviewRequest } from "./helpers/request";
import { useAddSalesMutation } from "@services/sales";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempSalesProducts from "@hooks/useTempSalesProducts";
import { generateInvoiceId } from "@utils/index";
import { useTranslation } from "react-i18next";
import { APP_NAVLINKS } from "@/routes/routes";
import { NavLink, useNavigate } from "react-router";
import { IconList } from "@tabler/icons-react";

export default function NewIndex() {
    const navigate = useNavigate()
    const { t } = useTranslation();
    const [ addSales, { isLoading: isAddingSales } ] = useAddSalesMutation();
    const salesForm = useForm(salesOverviewRequest());
    const { salesProducts, refetch } = useTempSalesProducts({ type: "sales" });

    // =============== tracks whether the submit was triggered via POS Print ===============
    const withPosPrintRef = useRef(false);

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

        const discountValue = formValues.isDiscountPercentage
            ? (subTotal * (Number(formValues.discountAmount) || 0)) / 100
            : Number(formValues.discountAmount) || 0;

        const vat = 0;
        const grandTotal = Math.max(subTotal - discountValue + vat, 0);
        const isSplitPaymentActive = payments.length > 1;
        const primaryPayment = payments[ 0 ] ?? {};

        const payload = {
            invoice: generateInvoiceId(),
            customer_id: formValues.customer_id ?? "",
            sub_total: subTotal,
            discount_type: formValues.isDiscountPercentage ? "Percentage" : "Flat",
            discount: Number(formValues.discountAmount) || 0,
            discount_calculation: discountValue,
            vat,
            total: grandTotal,
            payment: String(formValues.paymentAmount ?? ""),
            transaction_mode_id: primaryPayment.transaction_mode_id ?? "",
            mode_name: isSplitPaymentActive ? "Multiple" : (primaryPayment.transaction_mode_name ?? ""),
            multi_transaction: isSplitPaymentActive ? 1 : 0,
            payments: JSON.stringify(payments),
            narration: formValues.salesNarration ?? "",
            invoice_date: formValues.salesDate
                ? dayjs(formValues.salesDate).format("YYYY-MM-DD")
                : dayjs().format("YYYY-MM-DD"),
            items: salesProducts.map((item) => ({
                product_id: item.product_id,
                warehouse_id: item.warehouse_id || null,
                quantity: Number(item.quantity) || 0,
                sales_price: Number(item.sales_price) || 0,
                purchase_price: Number(item.purchase_price) || 0,
                bonus_quantity: item.bonus_quantity || 0,
                sub_total: (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
                name: item.display_name ?? "",
            })),
        };

        try {
            const response = await addSales(payload).unwrap();

            if (response.data) {
                const shouldPrint = withPosPrintRef.current;

                showNotification("Sale added successfully", "teal");

                // =============== clear local cart after successful submission ===============
                await window.dbAPI.deleteDataFromTable("temp_sales_products", { type: "sales" });
                refetch();
                salesForm.reset();

                if (shouldPrint) {
                    window.deviceAPI.thermalPrint(response.data);
                }
            } else {
                showNotification(response.message, "red");
            }
        } catch (error) {
            console.error(error);
            showNotification(error.data?.message || "Failed to save sale", "red");
        } finally {
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
    };

    return (
        <Box>
            <Flex justify="space-between" align="center" mb="4xs">
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
            </Flex>
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
                />
            </Box>
        </Box>
    );
}
