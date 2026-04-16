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

	const paymentAmount = Number(itemsForm.values.paymentAmount) || 0;
	const dueAmountValue = Number(itemsForm.values.dueAmount) || 0;
	const discountValue = Math.max(itemsTotal - paymentAmount - dueAmountValue, 0);
	const discountPercent = itemsTotal > 0 ? (discountValue / itemsTotal) * 100 : 0;

	return (
		<Box bg="var(--theme-tertiary-color-0)" p="xs">
			<ItemsTableSection
				itemsProducts={itemsProducts || []}
				refetch={refetch}
				itemsTotal={itemsTotal}
				discountPercent={discountPercent}
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
