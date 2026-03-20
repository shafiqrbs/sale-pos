import { ActionIcon, Box, Flex, Grid, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import useConfigData from "@hooks/useConfigData";
import SelectForm from "@components/form-builders/SelectForm";
import AddVendorModal from "@components/modals/AddVendorModal";
import { IconUserPlus } from "@tabler/icons-react";
import { useGetVendorsQuery } from "@services/core/vendors";

export default function VendorInfoSection({ itemsForm }) {
	const { currencySymbol } = useConfigData();

	const { data: vendors } = useGetVendorsQuery();
	const [isAddVendorModalOpened, { open: openAddVendorModal, close: closeAddVendorModal }] =
		useDisclosure(false);

	return (
		<Box  bg="white">
			<Box>
				<SelectForm
					name="vendor_id"
					form={itemsForm}
					dropdownValue={vendors?.data?.map((vendor) => ({
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
					// clearable={false}
					// allowDeselect={false}
					tooltip="Vendor is required"
					rightSectionPointerEvents="pointer-events"
				/>

				<Box mt="xs" className="boxBackground textColor borderRadiusAll">
					<Grid columns={24} gutter={{ base: 8 }}>
						<Grid.Col span={12}>
							<Flex p="4xs" direction="column" gap={2} bg="var(--theme-tertiary-color-2)">
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
						<Grid.Col span={12}>
							<Flex p="4xs" direction="column" bg="var(--theme-tertiary-color-2)" gap={2}>
								<Text fz="xs" fw={500}>
									Credit Limit
								</Text>
								<Flex align="center" gap={4}>
									<Text fz="xs">{currencySymbol}</Text>
									<Text fz="sm" fw={600}>
										0.00
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
				itemsForm={itemsForm}
			/>
		</Box>
	);
}
