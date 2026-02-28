import React from "react";
import { Grid, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import InvoiceForm from "./form/InvoiceForm";
import VendorOverview from "./Overview";
import { vendorOverviewRequest } from "./helpers/request";

export default function NewIndex() {
    const { initialValues } = vendorOverviewRequest();

    const purchaseForm = useForm({
        initialValues,
    });

    const handleSubmit = (formValues) => {
        // =============== handle purchase form submit with all core values and items ===============
        // you can replace this with actual api integration when backend is ready
        console.info("purchase submit values:", formValues);
    };

    return (
        <Box
            component="form"
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

