import {
    ActionIcon,
    Box,
    Flex,
    Grid,
    Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import useConfigData from "@hooks/useConfigData";
import useCoreVendors from "@hooks/useCoreVendors";
import SelectForm from "@components/form-builders/SelectForm";
import AddVendorModal from "@components/modals/AddVendorModal";
import { IconUserPlus } from "@tabler/icons-react";

export default function VendorInfoSection({ purchaseForm }) {
    const { configData } = useConfigData();
    const currencySymbol = configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

    const { vendors } = useCoreVendors();
    const [ isAddVendorModalOpened, { open: openAddVendorModal, close: closeAddVendorModal } ] = useDisclosure(false);

    return (
        <Box
            bd="1px solid #dee2e6"
            bg="white"
            p="3xs"
            className="borderRadiusAll"
        >
            <Box>
                <SelectForm
                    name="vendor_id"
                    form={purchaseForm}
                    dropdownValue={vendors.map((vendor) => ({
                        value: String(vendor.id),
                        label: vendor.name,
                    }))}
                    placeholder="Search vendor/supplier"
                    rightSection={
                        <ActionIcon
                            onClick={(event) => {
                                event.stopPropagation();
                                openAddVendorModal();
                            }}
                        >
                            <IconUserPlus size={16} />
                        </ActionIcon>
                    }
                    rightSectionPointerEvents="pointer-events"
                />

                <Box
                    mt="xs"
                    px="xs"
                    py={8}
                    className="boxBackground textColor borderRadiusAll"
                >
                    <Grid columns={24} gutter={{ base: 8 }}>
                        <Grid.Col span={6}>
                            <Flex direction="column" gap={2}>
                                <Text fz="xs" fw={500}>
                                    Outstanding
                                </Text>
                                <Flex align="center" gap={4}>
                                    <Text fz="xs">{currencySymbol}</Text>
                                    <Text fz="sm" fw={600}>
                                        0.00
                                    </Text>
                                </Flex>
                            </Flex>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Flex direction="column" gap={2}>
                                <Text fz="xs" fw={500}>
                                    Purchase
                                </Text>
                                <Flex align="center" gap={4}>
                                    <Text fz="xs">{currencySymbol}</Text>
                                    <Text fz="sm" fw={600}>
                                        0
                                    </Text>
                                </Flex>
                            </Flex>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Flex direction="column" gap={2}>
                                <Text fz="xs" fw={500}>
                                    Discount
                                </Text>
                                <Flex align="center" gap={4}>
                                    <Text fz="xs">{currencySymbol}</Text>
                                    <Text fz="sm" fw={600}>
                                        0
                                    </Text>
                                </Flex>
                            </Flex>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Flex direction="column" gap={2}>
                                <Text fz="xs" fw={500}>
                                    Credit Limit
                                </Text>
                                <Flex align="center" gap={4}>
                                    <Text fz="xs">{currencySymbol}</Text>
                                    <Text fz="sm" fw={600}>
                                        0
                                    </Text>
                                </Flex>
                            </Flex>
                        </Grid.Col>
                    </Grid>
                </Box>
            </Box>

            <AddVendorModal
                opened={isAddVendorModalOpened}
                onClose={closeAddVendorModal}
                purchaseForm={purchaseForm}
            />
        </Box>
    );
}

