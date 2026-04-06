import { Box, Flex, Grid, Select, Text } from "@mantine/core";
import useConfigData from "@hooks/useConfigData";
import useGetCoreCustomers from "@hooks/useGetCoreCustomers";
import { useTranslation } from "react-i18next";

export default function CustomerInfoSection({ itemsForm }) {
	const { t } = useTranslation();
	const { currencySymbol } = useConfigData();
	const { coreCustomers } = useGetCoreCustomers();

	const customerOptions = coreCustomers?.map((customer) => ({
		value: String(customer.id),
		label: customer.name,
	})) ?? [];

	return (
		<Box bd="1px solid #dee2e6" bg="white" p="3xs" className="borderRadiusAll">
			<Select
				placeholder={t("SearchCustomerOptional")}
				data={customerOptions}
				searchable
				clearable
				value={itemsForm.values.customer_id || null}
				onChange={(value) => itemsForm.setFieldValue("customer_id", value ?? "")}
				nothingFoundMessage={t("NoCustomerFound")}
			/>

			<Box mt="xs" className="boxBackground textColor borderRadiusAll">
				<Grid columns={24} gutter={{ base: 8 }}>
					<Grid.Col span={8}>
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
					<Grid.Col span={8}>
						<Flex p="4xs" direction="column" bg="var(--theme-tertiary-color-2)" gap={2}>
							<Text fz="xs" fw={500}>
								Total Sales
							</Text>
							<Flex align="center" gap={4}>
								<Text fz="xs">{currencySymbol}</Text>
								<Text fz="sm" fw={600}>
									0.00
								</Text>
							</Flex>
						</Flex>
					</Grid.Col>
					<Grid.Col span={8}>
						<Flex p="4xs" direction="column" bg="var(--theme-tertiary-color-2)" gap={2}>
							<Text fz="xs" fw={500}>
								Discount
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
	);
}
