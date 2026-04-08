import { Box, Overlay, Paper, Progress, Stack, Text } from "@mantine/core";
import { IconDatabase } from "@tabler/icons-react";

const TABLE_DISPLAY_NAMES = {
	core_products: "Products",
	core_customers: "Customers",
	core_vendors: "Vendors",
	core_users: "Users",
	accounting_transaction_mode: "Transaction Modes",
	config_data: "Configuration",
	categories: "Categories",
	printer: "Printer",
};

// =============== shown as an overlay during bulk db inserts, accepts a progress object ================
export default function DatabaseInsertProgress({ visible, progress }) {
	if (!visible) return null;

	const { table = "", inserted = 0, total = 0, percent = 0 } = progress || {};
	const displayName = TABLE_DISPLAY_NAMES[table] || table;

	return (
		<Overlay
			color="#000"
			backgroundOpacity={0.65}
			blur={4}
			zIndex={9999}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Paper
				radius="lg"
				p="xl"
				shadow="xl"
				style={{
					width: "100%",
					maxWidth: 460,
					background: "linear-gradient(145deg, #1a1b1e 0%, #25262b 100%)",
					border: "1px solid rgba(255,255,255,0.08)",
				}}
			>
				<Stack gap="lg">
					{/* =============== header icon + label ================ */}
					<Box
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
						}}
					>
						<Box
							style={{
								width: 44,
								height: 44,
								borderRadius: 10,
								background: "rgba(250,82,82,0.15)",
								border: "1px solid rgba(250,82,82,0.3)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								flexShrink: 0,
							}}
						>
							<IconDatabase size={22} color="#fa5252" stroke={1.5} />
						</Box>
						<Box>
							<Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={0.8}>
								Setting up database
							</Text>
							<Text size="sm" fw={600} c="white" mt={2}>
								Importing data, please wait…
							</Text>
						</Box>
					</Box>

					{/* =============== progress bar ================ */}
					<Box>
						<Progress
							value={percent}
							size="md"
							radius="xl"
							color="red.6"
							animated
							styles={{
								root: {
									background: "rgba(255,255,255,0.08)",
								},
							}}
						/>

						{/* =============== progress details below the bar ================ */}
						<Box
							mt="sm"
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "flex-end",
							}}
						>
							<Stack gap={2}>
								<Text size="xs" c="dimmed">
									Table
								</Text>
								<Text
									size="sm"
									fw={600}
									c="white"
									ff="monospace"
									style={{ wordBreak: "break-all" }}
								>
									{displayName || "—"}
								</Text>
								{total > 0 && (
									<Text size="xs" c="dimmed" mt={2}>
										Inserting {displayName}
									</Text>
								)}
							</Stack>

							<Stack gap={2} style={{ textAlign: "right" }}>
								<Text size="xs" c="dimmed">
									Progress
								</Text>
								<Text size="sm" fw={700} c="red.4" ff="monospace">
									{percent}%
								</Text>
								{total > 0 && (
									<Text size="xs" c="dimmed" mt={2}>
										{inserted.toLocaleString()} / {total.toLocaleString()} rows
									</Text>
								)}
							</Stack>
						</Box>
					</Box>

					{/* =============== animated dots to show activity ================ */}
					<Box
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							opacity: 0.5,
						}}
					>
						{[0, 1, 2].map((dotIndex) => (
							<Box
								key={dotIndex}
								style={{
									width: 6,
									height: 6,
									borderRadius: "50%",
									background: "#fa5252",
									animation: `pulse 1.4s ease-in-out ${dotIndex * 0.2}s infinite`,
								}}
							/>
						))}
						<Text size="xs" c="dimmed" ml={4}>
							Writing to local database
						</Text>
					</Box>
				</Stack>
			</Paper>

			<style>{`
				@keyframes pulse {
					0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
					40% { opacity: 1; transform: scale(1); }
				}
			`}</style>
		</Overlay>
	);
}
