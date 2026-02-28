import React from "react";
import { Box, Grid, TextInput } from "@mantine/core";
import GlobalModal from "./GlobalModal.jsx";

export default function AddVendorModal({ opened, onClose, purchaseForm }) {
    const { vendorName, vendorPhone, vendorEmail } = purchaseForm.values;

    return (
        <GlobalModal
            opened={opened}
            onClose={onClose}
            title="Add Vendor"
            size="sm"
        >
            <Box>
                <Grid gutter={6}>
                    <Grid.Col span={12}>
                        <TextInput
                            value={vendorName}
                            onChange={(event) =>
                                purchaseForm.setFieldValue("vendorName", event.currentTarget.value)
                            }
                            placeholder="Vendor Name"
                            size="xs"
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <TextInput
                            value={vendorPhone}
                            onChange={(event) =>
                                purchaseForm.setFieldValue("vendorPhone", event.currentTarget.value)
                            }
                            placeholder="+880"
                            size="xs"
                        />
                    </Grid.Col>
                    <Grid.Col span={12}>
                        <TextInput
                            value={vendorEmail}
                            onChange={(event) =>
                                purchaseForm.setFieldValue("vendorEmail", event.currentTarget.value)
                            }
                            placeholder="Email"
                            size="xs"
                        />
                    </Grid.Col>
                </Grid>
            </Box>
        </GlobalModal>
    );
}
