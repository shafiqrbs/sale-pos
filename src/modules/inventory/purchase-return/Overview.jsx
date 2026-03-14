import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	itemsForm,
	isAddingItem,
	itemsProducts,
	refetch,
	onQuantityChange,
	onPriceChange,
	onRemoveItem,
	isEditMode = false,
}) {
	const itemsTotal = useMemo(() => {
		return (itemsProducts || []).reduce(
			(accumulator, item) => accumulator + (item.quantity || 0) * (item.purchase_price || 0),
			0
		);
	}, [itemsProducts]);

	return (
		<Box bg="var(--theme-tertiary-color-0)" p="xs">
			<ItemsTableSection
				itemsProducts={itemsProducts || []}
				refetch={refetch}
				itemsTotal={itemsTotal}
				onQuantityChange={onQuantityChange}
				onPriceChange={onPriceChange}
				onRemoveItem={onRemoveItem}
			/>

			<PaymentSection
				itemsForm={itemsForm}
				itemsTotal={itemsTotal}
				isAddingItem={isAddingItem}
				isEditMode={isEditMode}
			/>
		</Box>
	);
}
