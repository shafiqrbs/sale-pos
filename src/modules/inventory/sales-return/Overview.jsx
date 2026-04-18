import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	itemsForm,
	isAddingItem,
	itemsProducts,
	selectedSaleSummary = null,
	onItemUpdate,
	onRemoveItem,
	isEditMode = false,
}) {
	const itemsTotal = useMemo(() => {
		return (itemsProducts || []).reduce((accumulator, item) => {
			return accumulator + (Number(item.sub_total) || 0);
		}, 0);
	}, [itemsProducts]);

	return (
		<Box>
			<ItemsTableSection
				itemsProducts={itemsProducts || []}
				itemsTotal={itemsTotal}
				selectedSaleSummary={selectedSaleSummary}
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
