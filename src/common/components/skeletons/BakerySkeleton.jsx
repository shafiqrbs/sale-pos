import React from 'react'
import { Box, Grid, Skeleton, ScrollArea, Group, Stack, Card } from '@mantine/core'
import { useOutletContext } from 'react-router'

// =============== skeleton for tables component ================
const TablesSkeleton = () => (
    <Box mb="xs">
        <Skeleton height={40} radius="md" />
    </Box>
)

// =============== skeleton for categories sidebar ================
const CategoriesSkeleton = ({ mainAreaHeight }) => (
    <ScrollArea h={mainAreaHeight} type="never" scrollbars="y">
        {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
                key={index}
                height={40}
                radius={4}
                mt="xs"
                mb="xs"
            />
        ))}
    </ScrollArea>
)

// =============== skeleton for product filters ================
const ProductFiltersSkeleton = () => (
    <Grid gutter={{ base: 4 }} align="center" mt={4}>
        <Grid.Col span={3}>
            <Skeleton height={34} radius="sm" />
        </Grid.Col>
        <Grid.Col span={6}>
            <Skeleton height={34} radius="sm" />
        </Grid.Col>
        <Grid.Col span={3}>
            <Skeleton height={34} radius="sm" />
        </Grid.Col>
    </Grid>
)

// =============== skeleton for product grid items ================
const ProductGridSkeleton = () => (
    <Grid columns={12} gutter="4xs">
        {Array.from({ length: 12 }).map((_, index) => (
            <Grid.Col span={3} key={index}>
                <Card shadow="md" radius="md" padding="xs" h="100%">
                    <Skeleton height={120} radius="sm" mb="xs" />
                    <Skeleton height={16} width="80%" radius="sm" mb="xs" />
                    <Skeleton height={20} width="60%" radius="sm" />
                </Card>
            </Grid.Col>
        ))}
    </Grid>
)

// =============== skeleton for product list section ================
const ProductListSkeleton = ({ mainAreaHeight }) => (
    <Box bg="white" w="100%" className="border-radius">
        <Grid columns={12} gutter="4xs" pl="3xs" pb="3xs">
            <Grid.Col span={3}>
                <CategoriesSkeleton mainAreaHeight={mainAreaHeight} />
            </Grid.Col>
            <Grid.Col span={9}>
                <Box bg="gray.8" px="les" pt="es" pb="les" mb="les" bdrs={6}>
                    <ProductFiltersSkeleton />
                </Box>
                <Box bg="gray.8" p="4xs" bdrs={6}>
                    <ScrollArea h={mainAreaHeight - 60} type="never" scrollbars="y">
                        <ProductGridSkeleton />
                    </ScrollArea>
                </Box>
            </Grid.Col>
        </Grid>
    </Box>
)

// =============== skeleton for checkout table ================
const CheckoutTableSkeleton = () => (
    <Box>
        <Skeleton height={40} radius="md" mb="xs" />
        {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton
                key={index}
                height={50}
                radius="sm"
                mb="xs"
            />
        ))}
    </Box>
)

// =============== skeleton for subtotal section ================
const SubTotalSkeleton = () => (
    <Group
        h={34}
        justify="space-between"
        align="center"
        pt={0}
        bg="gray.4"
        style={{
            borderTop: "2px solid var(--mantine-color-gray-4)",
        }}
    >
        <Skeleton height={16} width={80} radius="sm" />
        <Group gap="2xs" pr="sm" align="center">
            <Skeleton height={16} width={16} radius="sm" />
            <Skeleton height={16} width={60} radius="sm" />
        </Group>
    </Group>
)

// =============== skeleton for transaction information ================
const TransactionInformationSkeleton = () => (
    <>
        <Grid
            columns={13}
            gutter={4}
            justify="center"
            align="center"
            pb={4}
            bg={"gray.1"}
        >
            <Grid.Col span={7} px={4}>
                <Grid bg={"gray.1"} px={4}>
                    <Grid.Col span={6}>
                        <Stack gap={0}>
                            <Group justify="space-between" gap={0}>
                                <Skeleton height={14} width={30} radius="sm" />
                                <Skeleton height={14} width={50} radius="sm" />
                            </Group>
                            <Group justify="space-between" mt="xs">
                                <Skeleton height={14} width={30} radius="sm" />
                                <Skeleton height={14} width={40} radius="sm" />
                            </Group>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <Group justify="space-between">
                            <Skeleton height={14} width={60} radius="sm" />
                            <Skeleton height={14} width={40} radius="sm" />
                        </Group>
                        <Group justify="space-between" mt="xs">
                            <Skeleton height={14} width={20} radius="sm" />
                            <Skeleton height={14} width={30} radius="sm" />
                        </Group>
                    </Grid.Col>
                </Grid>
            </Grid.Col>
            <Grid.Col span={3}>
                <Stack
                    gap={0}
                    align="center"
                    justify="center"
                    bg="gray.8"
                    py={4}
                    bdrs={4}
                >
                    <Skeleton height={20} width={80} radius="sm" />
                    <Skeleton height={14} width={40} radius="sm" mt="xs" />
                </Stack>
            </Grid.Col>
            <Grid.Col span={3}>
                <Stack
                    gap={0}
                    align="center"
                    justify="center"
                    bg="red"
                    py={4}
                    bdrs={4}
                >
                    <Skeleton height={20} width={80} radius="sm" />
                    <Skeleton height={14} width={40} radius="sm" mt="xs" />
                </Stack>
            </Grid.Col>
        </Grid>
        <Grid
            columns={24}
            gutter={2}
            align="center"
            justify="center"
            mb={4}
        >
            <Grid.Col span={21}>
                <Box mr={4} style={{ position: "relative" }}>
                    <Group m={0} py={8} justify="flex-start" align="flex-start" gap="0" wrap="nowrap">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <Box key={index} p={4}>
                                <Skeleton height={48} width={56} radius="sm" />
                            </Box>
                        ))}
                    </Group>
                </Box>
            </Grid.Col>
            <Grid.Col span={3} style={{ textAlign: "right" }} pr="8">
                <Skeleton height={40} width={40} radius="md" />
            </Grid.Col>
        </Grid>
    </>
)

// =============== skeleton for transaction form inputs ================
const TransactionFormSkeleton = () => (
    <Box m={0} mb={"12"}>
        <Grid columns={24} gutter={{ base: 8 }} pr={"2"} align="center" justify="center">
            <Grid.Col span={6}>
                <Skeleton height={34} radius="sm" />
            </Grid.Col>
            <Grid.Col span={6}>
                <Skeleton height={34} radius="sm" />
            </Grid.Col>
            <Grid.Col span={6}>
                <Skeleton height={34} radius="sm" />
            </Grid.Col>
            <Grid.Col span={6}>
                <Skeleton height={34} radius="sm" />
            </Grid.Col>
        </Grid>
    </Box>
)

// =============== skeleton for action buttons ================
const ActionButtonsSkeleton = () => (
    <Grid columns={12} gutter={{ base: 2 }}>
        <Grid.Col span={4}>
            <Skeleton height={48} radius="sm" />
        </Grid.Col>
        <Grid.Col span={4}>
            <Skeleton height={48} radius="sm" />
        </Grid.Col>
        <Grid.Col span={4}>
            <Skeleton height={48} radius="sm" />
        </Grid.Col>
    </Grid>
)

// =============== skeleton for checkout section ================
const CheckoutSkeleton = () => (
    <Box pr="3xs">
        <CheckoutTableSkeleton />
        <SubTotalSkeleton />
        <Stack bg="gray.0" align="stretch" justify="center" mt={6} gap={4} pl={4} pr={2} mb={0}>
            <TransactionInformationSkeleton />
            <Group gap={6} mb={4} preventGrowOverflow={false} grow align="center" wrap="nowrap">
                <Skeleton height={34} radius="sm" />
            </Group>
            <TransactionFormSkeleton />
        </Stack>
    </Box>
)

export default function BakerySkeleton() {
    const { mainAreaHeight } = useOutletContext()

    return (
        <Box bg="white" pos="absolute" top={46} left={0} right={0} bottom={0} style={{ zIndex: 999 }}>
            {/* <TablesSkeleton /> */}
            <Grid columns={12} gutter="4xs">
                <Grid.Col span={8}>
                    <ProductListSkeleton mainAreaHeight={mainAreaHeight} />
                </Grid.Col>
                <Grid.Col span={4}>
                    <CheckoutSkeleton />
                </Grid.Col>
            </Grid>
        </Box>
    )
}
