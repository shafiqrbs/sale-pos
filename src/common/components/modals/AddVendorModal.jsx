import React, { useState } from "react";
import { Box, Button, Flex, Grid, TextInput } from "@mantine/core";
import GlobalModal from "./GlobalModal.jsx";
import { useTranslation } from "react-i18next";
import PhoneNumber from "@components/form-builders/PhoneNumberInput.jsx";
import useCoreVendors from "@hooks/useCoreVendors";
import { useForm } from "@mantine/form";

export default function AddVendorModal({ opened, onClose, purchaseForm }) {
    const { t } = useTranslation()

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            title={t("AddVendor")}
            size="sm"
        >
            {opened && (
                <AddVendorModalForm
                    purchaseForm={purchaseForm}
                    onClose={onClose}
                />
            )}
        </GlobalModal>
    );
}

function AddVendorModalForm({ purchaseForm, onClose }) {
    const { t } = useTranslation();
    const vendorForm = useForm({
        initialValues: {
            name: "",
            mobile: "+880",
            email: "",
        },
        validate: {
            name: (value) => value.trim() === "" ? "Name is required" : null,
            mobile: (value) => {
                if (!value) return "Mobile is required";
                if (value.trim().length < 11) return "Mobile must be at least 11 digits";
                return null;
            },
            email: (value) => value.trim() === "" ? "Email is required" : null,
        },
    });
    const { addVendor } = useCoreVendors();

    const handleSubmit = async (values) => {
        try {
            await addVendor({
                name: values.name,
                mobile: values.mobile,
                email: values.email,
            });
            onClose();
        } catch (error) {
            console.error(error)
        }
    };

    return (
        <form id="vendorForm">
            <Grid gutter={6}>
                <Grid.Col span={12}>
                    <TextInput
                        value={vendorForm.values.name}
                        onChange={(event) => vendorForm.setFieldValue("name", event.currentTarget.value)}
                        placeholder="Vendor Name"
                        size="xs"
                        name="name"
                    />
                </Grid.Col>
                <Grid.Col span={12}>
                    <PhoneNumber
                        form={vendorForm}
                        name="mobile"
                        placeholder="+880"
                        size="xs"
                        required
                    />
                </Grid.Col>
                <Grid.Col span={12}>
                    <TextInput
                        value={vendorForm.values.email}
                        onChange={(event) => vendorForm.setFieldValue("email", event.currentTarget.value)}
                        placeholder="Email"
                        size="xs"
                        name="email"
                    />
                </Grid.Col>
            </Grid>
            <Flex justify="flex-end" mt="xs">
                <Button size="sm" form="vendorForm" onClick={vendorForm.onSubmit(handleSubmit)}>
                    {t("AddVendor")}
                </Button>
            </Flex>
        </form>
    );
}
