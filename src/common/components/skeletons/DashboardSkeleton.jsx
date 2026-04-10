import { Box, Divider, Flex, Grid, Group, Paper, ScrollArea, Skeleton, Stack } from "@mantine/core";

// Mirrors StatCard layout
function StatCardSkeleton() {
	return (
		<Paper p="lg" radius="md" withBorder>
			<Flex justify="space-between" align="center">
				<Box>
					<Skeleton height={12} width={90} radius="sm" mb={8} />
					<Skeleton height={22} width={110} radius="sm" />
				</Box>
				<Skeleton height={32} width={32} circle />
			</Flex>
		</Paper>
	);
}

// Mirrors MetricCard layout
function MetricCardSkeleton() {
	return (
		<Paper p="md" radius="md" withBorder>
			<Group justify="space-between" wrap="nowrap">
				<Box>
					<Skeleton height={12} width={120} radius="sm" mb={8} />
					<Skeleton height={20} width={80} radius="sm" />
					<Skeleton height={10} width={60} radius="sm" mt={6} />
				</Box>
				<Skeleton height={20} width={20} circle />
			</Group>
		</Paper>
	);
}

// Left column: Sales Summary (10 stat cards in 2-col grid)
function SalesSummarySkeleton({ height }) {
	return (
		<Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
			<Flex align="center" justify="space-between" mb="md">
				<Skeleton height={22} width={260} radius="sm" />
				<Skeleton height={28} width={28} circle />
			</Flex>
			<Divider />
			<ScrollArea scrollbarSize={4} scrollbars="y" type="hover" h={height - 64}>
				<Grid gutter="md" mt="md">
					{Array.from({ length: 10 }).map((_, i) => (
						<Grid.Col key={i} span={6}>
							<StatCardSkeleton />
						</Grid.Col>
					))}
				</Grid>
			</ScrollArea>
		</Paper>
	);
}

// Right top: Transaction Modes (pie chart + legend)
function TransactionModesSkeleton({ cardHeight }) {
	return (
		<Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
			<Skeleton height={22} width={180} radius="sm" mb="md" />
			<Divider />
			<ScrollArea scrollbarSize={4} scrollbars="y" type="hover" h={cardHeight}>
				<Flex gap={50} align="center" justify="center" mt="md">
					<Skeleton height={200} width={200} circle />
					<Stack gap="sm" mt="md">
						{Array.from({ length: 3 }).map((_, i) => (
							<Group key={i} gap="sm">
								<Skeleton height={12} width={12} circle />
								<Skeleton height={14} width={60} radius="sm" />
								<Skeleton height={18} width={30} radius="xl" />
								<Skeleton height={14} width={70} radius="sm" />
							</Group>
						))}
					</Stack>
				</Flex>
			</ScrollArea>
		</Paper>
	);
}

// Right middle: Top Selling Products (table)
function TopSellingProductsSkeleton() {
	return (
		<Paper shadow="sm" p="lg" radius="md" withBorder>
			<Skeleton height={22} width={200} radius="sm" mb="md" />
			<Box>
				{/* Table header */}
				<Skeleton height={36} radius="sm" mb={4} />
				{/* Table rows */}
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} height={40} radius="sm" mb={4} />
				))}
			</Box>
		</Paper>
	);
}

// Right bottom: Today's Overview (metric cards)
function TodaysOverviewSkeleton({ cardHeight }) {
	return (
		<Paper shadow="sm" p="lg" radius="md" withBorder>
			<Skeleton height={22} width={160} radius="sm" mb="md" />
			<ScrollArea scrollbarSize={4} scrollbars="y" type="hover" h={cardHeight}>
				<Stack gap="md">
					{Array.from({ length: 6 }).map((_, i) => (
						<MetricCardSkeleton key={i} />
					))}
				</Stack>
			</ScrollArea>
		</Paper>
	);
}

export default function DashboardSkeleton({ height, cardHeight }) {
	return (
		<Box p="md">
			<Grid gutter="md" mb="md">
				{/* Left column: Sales Summary */}
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Grid gutter="md" mb="md">
						<Grid.Col span={{ base: 12 }}>
							<SalesSummarySkeleton height={height} />
						</Grid.Col>
					</Grid>
				</Grid.Col>

				{/* Right column: Transaction Modes + Top Products + Overview */}
				<Grid.Col span={{ base: 12, md: 6 }}>
					<Grid gutter="md" mb="md">
						<Grid.Col span={{ base: 12 }}>
							<TransactionModesSkeleton cardHeight={cardHeight} />
						</Grid.Col>
						<Grid.Col span={{ base: 12 }}>
							<TopSellingProductsSkeleton cardHeight={cardHeight} />
						</Grid.Col>
						<Grid.Col span={{ base: 12 }}>
							<TodaysOverviewSkeleton cardHeight={cardHeight} />
						</Grid.Col>
					</Grid>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
