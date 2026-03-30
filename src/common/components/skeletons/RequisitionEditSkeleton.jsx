import React from "react";
import { Box, Grid, Skeleton, ScrollArea, Stack, Flex, Group } from "@mantine/core";
import { useOutletContext } from "react-router";

// =============== skeleton for invoice form (left panel) ===============
const InvoiceFormSkeleton = ({ containerHeight }) => (
	<Box bd="1px solid #dee2e6" bg="white" className="borderRadiusAll">
		<Skeleton height={36} radius="sm" />
		<ScrollArea h={containerHeight} type="never">
			<Box p="sm">
				<Box mt="md" bg="gray.1" p="xs">
					<Skeleton height={36} radius="sm" />
				</Box>
				<Box mt="md" bg="gray.1" p="xs">
					<Skeleton height={36} radius="sm" />
				</Box>
				<Box mt="md" bg="gray.1" p="xs">
					<Skeleton height={36} radius="sm" />
				</Box>
			</Box>
		</ScrollArea>
		<Flex p="sm" gap="xs" justify="space-between" align="center">
			<Skeleton height={36} width="60%" radius="sm" />
			<Skeleton height={36} width={150} radius="sm" />
		</Flex>
	</Box>
);

// =============== skeleton for items table header ===============
const ItemsTableHeaderSkeleton = () => (
	<Flex justify="space-between" align="center" mb="4xs">
		<Skeleton height={28} width={140} radius="sm" />
		<Skeleton height={36} width={130} radius="sm" />
	</Flex>
);

// =============== skeleton for items table rows ===============
const ItemsTableSkeleton = ({ tableHeight }) => (
	<Box bd="1px solid #dee2e6" bg="white">
		<Group gap={0} p="xs" bg="gray.1" style={{ borderBottom: "1px solid #dee2e6" }}>
			<Skeleton height={14} width={40} radius="sm" mr="md" />
			<Skeleton height={14} width="30%" radius="sm" mr="md" />
			<Skeleton height={14} width="15%" radius="sm" mr="md" />
			<Skeleton height={14} width={100} radius="sm" mr="md" />
			<Skeleton height={14} width={80} radius="sm" mr="md" />
			<Skeleton height={14} width={80} radius="sm" mr="md" />
			<Skeleton height={14} width={30} radius="sm" />
		</Group>
		<ScrollArea h={tableHeight - 40} type="never">
			{Array.from({ length: 6 }).map((_, index) => (
				<Group
					key={index}
					gap={0}
					p="xs"
					style={{ borderBottom: "1px solid #f1f3f5" }}
				>
					<Skeleton height={14} width={40} radius="sm" mr="md" />
					<Skeleton height={14} width="30%" radius="sm" mr="md" />
					<Skeleton height={14} width="15%" radius="sm" mr="md" />
					<Skeleton height={28} width={100} radius="sm" mr="md" />
					<Skeleton height={28} width={80} radius="sm" mr="md" />
					<Skeleton height={14} width={80} radius="sm" mr="md" />
					<Skeleton height={24} width={24} radius="sm" />
				</Group>
			))}
		</ScrollArea>
	</Box>
);

// =============== skeleton for items total bar ===============
const ItemsTotalSkeleton = () => (
	<Box mt="les" px="xs" py="4xs" bg="gray.1" className="borderRadiusAll">
		<Flex justify="space-between" align="center">
			<Skeleton height={28} width={120} radius="sm" />
			<Skeleton height={32} width={160} radius="sm" />
		</Flex>
	</Box>
);

// =============== skeleton for payment section ===============
const PaymentSectionSkeleton = () => (
	<Box bg="gray.1" p="xs">
		<Grid columns={24} gutter={8}>
			<Grid.Col span={10}>
				<Stack
					bd="1px solid #dee2e6"
					bg="white"
					p="xs"
					className="borderRadiusAll"
					h="100%"
					justify="space-between"
					gap={0}
				>
					<Skeleton height={60} radius="sm" />
				</Stack>
			</Grid.Col>
			<Grid.Col span={10}>
				<Box bd="1px solid #dee2e6" bg="white" p="xs" className="borderRadiusAll">
					<Grid gutter={6}>
						<Grid.Col span={12}>
							<Skeleton height={36} radius="sm" />
						</Grid.Col>
						<Grid.Col span={6}>
							<Skeleton height={36} radius="sm" />
						</Grid.Col>
						<Grid.Col span={6}>
							<Skeleton height={36} radius="sm" />
						</Grid.Col>
					</Grid>
				</Box>
			</Grid.Col>
			<Grid.Col span={4}>
				<Stack align="stretch" justify="flex-end" gap="1" h="100%">
					<Skeleton height={36} radius={0} />
					<Skeleton height={36} radius={0} />
				</Stack>
			</Grid.Col>
		</Grid>
	</Box>
);

export default function RequisitionEditSkeleton() {
	const { mainAreaHeight } = useOutletContext();
	const containerHeight = mainAreaHeight - 120;
	const tableHeight = mainAreaHeight - 220;

	return (
		<Grid columns={24} gutter={0}>
			<Grid.Col span={6}>
				<Box p="xs" pr={0}>
					<InvoiceFormSkeleton containerHeight={containerHeight} />
				</Box>
			</Grid.Col>
			<Grid.Col span={18}>
				<Box bg="var(--theme-tertiary-color-0)" p="xs">
					<Box bg="gray.1">
						<ItemsTableHeaderSkeleton />
						<ItemsTableSkeleton tableHeight={tableHeight} />
						<ItemsTotalSkeleton />
					</Box>
					<PaymentSectionSkeleton />
				</Box>
			</Grid.Col>
		</Grid>
	);
}
