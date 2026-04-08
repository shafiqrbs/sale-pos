import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	isAddingItem,
	itemsForm,
	itemsProducts,
	refetch,
	onQuantityChange,
	onRemoveItem,
	onMrpChange,
	onBonusQuantityChange,
	onExpiredDateChange,
	isEditMode = false,
}) {
	const itemsTotal = useMemo(() => {
		return (itemsProducts || []).reduce(
			(accumulator, item) => accumulator + (item.quantity || 0) * (item.mrp || 0),
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
				onRemoveItem={onRemoveItem}
				onMrpChange={onMrpChange}
				onBonusQuantityChange={onBonusQuantityChange}
				onExpiredDateChange={onExpiredDateChange}
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
