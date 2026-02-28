import React from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { useAddPurchaseMutation } from "@services/purchase";

export default function NewIndex() {
    const { initialValues } = vendorOverviewRequest();
    const [ addPurchase ] = useAddPurchaseMutation();

    const purchaseForm = useForm({
        initialValues,
    });

    const handleSubmit = async (formValues) => {
        const items = formValues.items || [];
        const subTotal = items.reduce(
            (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0),
            0
        );

        const discountValue = formValues.isDiscountPercentage
            ? (subTotal * (Number(formValues.discountAmount) || 0)) / 100
            : Number(formValues.discountAmount) || 0;

        const vat = 0;
        const total = Math.max(subTotal - discountValue + vat, 0);

        const payload = {
            vendor_id: formValues.vendor_id ?? "",
            vendor_name: formValues.vendorName ?? "",
            vendor_mobile: formValues.vendorPhone ?? "",
            vendor_email: formValues.vendorEmail ?? "",
            sub_total: subTotal,
            transaction_mode_id: formValues.transactionModeId ?? "",
            discount_type: formValues.isDiscountPercentage ? "Percentage" : "Flat",
            discount: Number(formValues.discountAmount) || 0,
            discount_calculation: discountValue,
            vat,
            total,
            payment: String(formValues.paymentAmount ?? ""),
            process: "",
            narration: formValues.purchaseNarration ?? "",
            warehouse_id: "",
            invoice_date: formValues.purchaseDate
                ? dayjs(formValues.purchaseDate).format("YYYY-MM-DD")
                : dayjs().format("YYYY-MM-DD"),
            items: items.map((item) => ({
                product_id: item.productId,
                warehouse_id: null,
                quantity: Number(item.quantity) || 0,
                purchase_price: Number(item.price) || 0,
                sales_price: Number(item.price) || 0,
                bonus_quantity: 0,
                sub_total: (Number(item.quantity) || 0) * (Number(item.price) || 0),
                name: item.productName ?? "",
            })),
        };

        try {
            await addPurchase(payload);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box
            component="form"
            id="purchaseForm"
            onSubmit={purchaseForm.onSubmit(handleSubmit)}
        >
            <Grid columns={24} gutter={0}>
                <Grid.Col span={6}>
                    <Box p="xs" pr={0}>
                        <InvoiceForm purchaseForm={purchaseForm} />
                    </Box>
                </Grid.Col>
                <Grid.Col span={18}>
                    <VendorOverview purchaseForm={purchaseForm} />
                </Grid.Col>
            </Grid>
        </Box>
    );
}

