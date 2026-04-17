import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	itemsForm,
	isAddingItem,
	itemsProducts,
	onItemUpdate,
	onRemoveItem,
	isEditMode = false,
}) {
	const itemsTotal = useMemo(() => {
		return (itemsProducts || []).reduce((accumulator, item) => {
			const stockQty = item.stock_quantity || 0;
			const damageQty = item.damage_quantity || 0;
			const price = item.sales_price || 0;
			return accumulator + (stockQty + damageQty) * price;
		}, 0);
	}, [itemsProducts]);

	return (
		<Box>
			<ItemsTableSection
				itemsProducts={itemsProducts || []}
				itemsTotal={itemsTotal}
				onItemUpdate={onItemUpdate}
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
