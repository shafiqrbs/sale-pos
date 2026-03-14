import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	purchaseForm,
	isAddingPurchase,
	purchaseProducts,
	refetch,
	onQuantityChange,
	onPriceChange,
	onRemoveItem,
	isEditMode = false,
}) {
	const itemsTotal = useMemo(() => {
		return (purchaseProducts || []).reduce(
			(accumulator, item) => accumulator + (item.quantity || 0) * (item.purchase_price || 0),
			0
		);
	}, [purchaseProducts]);

	return (
		<Box bg="var(--theme-tertiary-color-0)" p="xs">
			<ItemsTableSection
				purchaseProducts={purchaseProducts || []}
				refetch={refetch}
				itemsTotal={itemsTotal}
				onQuantityChange={onQuantityChange}
				onPriceChange={onPriceChange}
				onRemoveItem={onRemoveItem}
			/>

			<PaymentSection
				purchaseForm={purchaseForm}
				itemsTotal={itemsTotal}
				isAddingPurchase={isAddingPurchase}
				isEditMode={isEditMode}
			/>
		</Box>
	);
}
