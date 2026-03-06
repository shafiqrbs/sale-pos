import { useMemo } from "react";
import { Box } from "@mantine/core";
import ItemsTableSection from "./ItemsTableSection";
import PaymentSection from "./PaymentSection";

export default function Overview({
	salesForm,
	isAddingSales,
	salesProducts,
	refetch,
	onPosPrint,
	onReset,
	resetKey = 0,
}) {
	const itemsTotal = useMemo(() => {
		return (salesProducts || []).reduce(
			(accumulator, item) => accumulator + (item.quantity || 0) * (item.sales_price || 0),
			0
		);
	}, [salesProducts]);

	return (
		<Box bg="var(--theme-tertiary-color-0)" p="xs">
			<ItemsTableSection
				salesProducts={salesProducts || []}
				refetch={refetch}
				itemsTotal={itemsTotal}
			/>

			<PaymentSection
				salesForm={salesForm}
				itemsTotal={itemsTotal}
				isAddingSales={isAddingSales}
				onPosPrint={onPosPrint}
				onReset={onReset}
				resetKey={resetKey}
			/>
		</Box>
	);
}
