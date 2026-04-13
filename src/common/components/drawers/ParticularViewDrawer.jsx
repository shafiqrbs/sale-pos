import { Box, Text, Badge, Table } from "@mantine/core";
import { useTranslation } from "react-i18next";
import GlobalDrawer from "./GlobalDrawer";

export default function ParticularViewDrawer({ isLoading, opened, onClose, data }) {
	const { t } = useTranslation();

	const rows = [
		{ label: t("ID"), value: data?.id },
		{ label: t("SettingType"), value: data?.setting_type_name },
		{ label: t("SettingName"), value: data?.name },
		{ label: t("Slug"), value: data?.slug },
		{ label: t("CreatedDate"), value: data?.created },
		{
			label: t("IsPrivate"),
			value: (
				<Badge
					color={data?.is_private === 1 ? "blue" : "gray"}
					variant="filled"
					size="sm"
					radius="sm"
				>
					{data?.is_private === 1 ? t("Yes") : t("No")}
				</Badge>
			),
		},
		{
			label: t("Status"),
			value: (
				<Badge color={data?.status === 1 ? "green" : "red"} variant="filled" size="sm" radius="sm">
					{data?.status === 1 ? t("Active") : t("Inactive")}
				</Badge>
			),
		},
	];

	return (
		<GlobalDrawer
			loading={isLoading}
			opened={opened}
			onClose={onClose}
			position="right"
			size="400px"
			title={
				<Text fw={600} fz={16}>
					{t("ParticularSettingN")}
				</Text>
			}
		>
			<Box className="borderRadiusAll" style={{ overflow: "hidden" }}>
				<Table withRowBorders verticalSpacing="sm" horizontalSpacing="md">
					<Table.Tbody>
						{rows.map((row) => (
							<Table.Tr key={row.label}>
								<Table.Td w="40%" bg="var(--mantine-color-gray-0)">
									<Text size="sm" fw={600} c="var(--mantine-color-gray-7)">
										{row.label}
									</Text>
								</Table.Td>
								<Table.Td>
									{typeof row.value === "string" || typeof row.value === "number" ? (
										<Text size="sm">{row.value ?? "—"}</Text>
									) : (
										(row.value ?? <Text size="sm">—</Text>)
									)}
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Box>
		</GlobalDrawer>
	);
}
