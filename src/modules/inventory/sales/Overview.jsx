import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	itemsForm,
	isAddingItem,
	itemsProducts,
	refetch,
	onPosPrint,
	onReset,
	resetKey = 0,
	onQuantityChange,
	onPriceChange,
	onDiscountChange,
	handleSubmit,
	onRemoveItem,
	isEditMode = false,
}) {
	const itemsTotal = useMemo(() => {
		return (itemsProducts || []).reduce(
			(accumulator, item) => accumulator + (item.quantity || 0) * (item.sales_price || 0),
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
				onDiscountChange={onDiscountChange}
				onRemoveItem={onRemoveItem}
			/>

			<PaymentSection
				itemsForm={itemsForm}
				itemsTotal={itemsTotal}
				isAddingItem={isAddingItem}
				onPosPrint={onPosPrint}
				onReset={onReset}
				resetKey={resetKey}
				isEditMode={isEditMode}
				handleSubmit={handleSubmit}
			/>
		</Box>
	);
}
