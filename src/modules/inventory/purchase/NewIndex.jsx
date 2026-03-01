import React from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import dayjs from "dayjs";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";
import { useAddPurchaseMutation } from "@services/purchase";
import { showNotification } from "@components/ShowNotificationComponent";

export default function NewIndex() {
    const { initialValues } = vendorOverviewRequest();
    const [ addPurchase, { isLoading: isAddingPurchase } ] = useAddPurchaseMutation();

    const purchaseForm = useForm({
        initialValues,
    });

    const handleSubmit = async (formValues) => {
        if (!formValues.items?.length) {
            showNotification("Add minimum one purchase item first", "red");
            return;
        }

        if (!formValues.vendor_id) {
            showNotification("Vendor is required", "red");
            return;
        }
        if (!formValues.transactionModeId) {
            showNotification("Transaction mode is required", "red");
            return;
        }
        if (!formValues.paymentAmount) {
            showNotification("Payment amount is required", "red");
            return;
        }

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
            const response = await addPurchase(payload).unwrap();
            if (response.data) {
                showNotification("Purchase added successfully", "teal");
                purchaseForm.reset();
            } else {
                showNotification(response.message, "red");
            }
        } catch (error) {
            console.error(error);
            showNotification(error.data?.message, "red");
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
                    <VendorOverview isAddingPurchase={isAddingPurchase} purchaseForm={purchaseForm} />
                </Grid.Col>
            </Grid>
        </Box>
    );
}

