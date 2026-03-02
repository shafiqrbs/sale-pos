import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({ purchaseForm, isAddingPurchase }) {
	const itemsTotal = useMemo(() => {
		const purchaseItems = purchaseForm.values.items || [];

		return purchaseItems.reduce(
			(accumulator, item) => accumulator + (item.quantity || 0) * (item.price || 0),
			0
		);
	}, [purchaseForm.values.items]);

	return (
		<Box bg="var(--theme-tertiary-color-0)" p="xs">
			<ItemsTableSection purchaseForm={purchaseForm} itemsTotal={itemsTotal} />

			<PaymentSection
				purchaseForm={purchaseForm}
				itemsTotal={itemsTotal}
				isAddingPurchase={isAddingPurchase}
			/>
		</Box>
	);
}
