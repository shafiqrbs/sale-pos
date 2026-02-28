import React, { useMemo } from "react";
import { Box } from "@mantine/core";
import PurchaseItemsTableSection from "./ItemsTableSection";
import PurchasePaymentSection from "./PaymentSection";

export default function Overview({ purchaseForm }) {
    const itemsTotal = useMemo(() => {
        const purchaseItems = purchaseForm.values.items || [];

        return purchaseItems.reduce(
            (accumulator, item) =>
                accumulator +
                (item.quantity || 0) * (item.price || 0),
            0
        );
    }, [ purchaseForm.values.items ]);

    return (
        <Box bg="var(--theme-grey-color-0)" p="xs">
            {/* <VendorInfoSection
                purchaseForm={purchaseForm}
            /> */}

            <PurchaseItemsTableSection
                purchaseForm={purchaseForm}
                itemsTotal={itemsTotal}
            />

            <PurchasePaymentSection
                purchaseForm={purchaseForm}
                itemsTotal={itemsTotal}
            />
        </Box>
    );
}
