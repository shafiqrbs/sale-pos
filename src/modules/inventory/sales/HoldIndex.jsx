import { Box } from "@mantine/core";
import HoldTable from "@modules/inventory/sales/_HoldTable";

export default function SalesIndex() {
	return (
		<Box p="xs" bg="var(--mantine-color-gray-2)">
			<HoldTable />
		</Box>
	);
}
