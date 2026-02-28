import React, { useState } from "react";
import { Box, Button, Flex, Grid, TextInput } from "@mantine/core";
import GlobalModal from "./GlobalModal.jsx";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation()
    const [ vendorName, setVendorName ] = useState("");
    const [ vendorPhone, setVendorPhone ] = useState("+880");
    const [ vendorEmail, setVendorEmail ] = useState("");

    const handleAdd = () => {
        purchaseForm.setFieldValue("vendorName", vendorName);
        purchaseForm.setFieldValue("vendorPhone", vendorPhone);
        purchaseForm.setFieldValue("vendorEmail", vendorEmail);
        onClose();
    };

    return (
        <Box>
            <Grid gutter={6}>
                <Grid.Col span={12}>
                    <TextInput
                        value={vendorName}
                        onChange={(event) => setVendorName(event.currentTarget.value)}
                        placeholder="Vendor Name"
                        size="xs"
                    />
                </Grid.Col>
                <Grid.Col span={12}>
                    <TextInput
                        value={vendorPhone}
                        onChange={(event) => setVendorPhone(event.currentTarget.value)}
                        placeholder="+880"
                        size="xs"
                    />
                </Grid.Col>
                <Grid.Col span={12}>
                    <TextInput
                        value={vendorEmail}
                        onChange={(event) => setVendorEmail(event.currentTarget.value)}
                        placeholder="Email"
                        size="xs"
                    />
                </Grid.Col>
            </Grid>
            <Flex justify="flex-end" mt="xs">
                <Button size="sm" onClick={handleAdd}>
                    {t("AddVendor")}
                </Button>
            </Flex>
        </Box>
    );
}
