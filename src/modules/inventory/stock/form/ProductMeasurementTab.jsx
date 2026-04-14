import { useMemo, useState } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Center,
	Checkbox,
	Divider,
	Grid,
	Group,
	Loader,
	ScrollArea,
	Select,
	Table as MantineTable,
	Text,
	TextInput,
	Flex,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useGetInventoryParticularQuery } from "@services/settings.js";
import {
	useGetProductMeasurementsQuery,
	useAddProductMeasurementMutation,
	useDeleteProductMeasurementMutation,
	useUpdateMeasurementSalesPurchaseMutation,
} from "@services/product.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

export default function ProductMeasurementTab({ product, productId }) {
	const [ resetKey, setResetKey ] = useState(0);
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();

	const { data: measurementsResponse, isLoading: isMeasurementsLoading } =
		useGetProductMeasurementsQuery(productId, { skip: !productId });

	const { data: productUnitData } = useGetInventoryParticularQuery({
		"dropdown-type": "product-unit",
	});

	const measurements = useMemo(
		() => measurementsResponse?.data ?? [],
		[ measurementsResponse ]
	);

	const unitOptions = useMemo(
		() =>
			productUnitData?.data?.map((item) => ({
				value: String(item.id),
				label: item.name,
			})) ?? [],
		[ productUnitData ]
	);

	const form = useForm({
		initialValues: {
			product_id: String(productId ?? ""),
			unit_id: "",
			quantity: "",
		},
		validate: {
			quantity: (value) =>
				!value || String(value).trim() === "" ? t("QuantityRequired") : null,
			unit_id: (value) => (!value ? t("UnitRequired") : null),
		},
	});

	const [ loadingCheckboxKey, setLoadingCheckboxKey ] = useState(null);

	const [ addMeasurement, { isLoading: isAdding } ] = useAddProductMeasurementMutation();
	const [ deleteMeasurement ] = useDeleteProductMeasurementMutation();
	const [ updateSalesPurchase ] = useUpdateMeasurementSalesPurchaseMutation();

	const handleAdd = async (values) => {
		try {
			const response = await addMeasurement(values).unwrap();
			const isSuccess = response?.status === 200 && response?.message === "success";
			if (!isSuccess) {
				showNotification(response?.message || t("CreateFailed"), "red");
				return;
			}
			showNotification(t("MeasurementAddedSuccessfully"), "teal");
			form.reset()
			setResetKey(Date.now())
		} catch (error) {
			console.error(error);
			showNotification(error?.data?.message || t("CreateFailed"), "red");
		}
	};

	const handleDelete = async (measurement) => {
		try {
			await deleteMeasurement({
				measurementId: measurement.id,
				productId,
			}).unwrap();
			showNotification(t("MeasurementDeletedSuccessfully"), "teal");
		} catch (error) {
			console.error(error);
			showNotification(error?.data?.message || t("DeleteFailed"), "red");
		}
	};

	const handleToggleSalesPurchase = async (measurement, type, currentValue) => {
		const checkboxKey = `${measurement.id}-${type}`;
		setLoadingCheckboxKey(checkboxKey);
		try {
			await updateSalesPurchase({
				productId,
				body: {
					check: !currentValue,
					unit_id: measurement.id,
					type,
				},
			}).unwrap();
		} catch (error) {
			console.error(error);
			showNotification(error?.data?.message || t("UpdateFailed"), "red");
		} finally {
			setLoadingCheckboxKey(null);
		}
	};

	return (
		<Box>
			<Text fw={600} size="md" mb="xs">
				{t("ProductMeasurement")}
			</Text>
			<Divider mb="sm" />

			<Flex component="form" onSubmit={form.onSubmit(handleAdd)} gap="sm" align="center" mb="sm">
				<TextInput
					w="100%"
					placeholder={t("QTY")}
					rightSection={
						<Text size="sm" c="dimmed" pr={4}>
							{product?.unit_name}
						</Text>
					}
					rightSectionWidth={50}
					{...form.getInputProps("quantity")}
				/>
				<Select
					key={resetKey}
					w="100%"
					placeholder={t("ChooseProductUnit")}
					data={unitOptions}
					searchable
					clearable
					{...form.getInputProps("unit_id")}
				/>
				<Button
					w={650}
					type="submit"
					loading={isAdding}
					leftSection={<IconPlus size={16} />}
				>
					{t("AddMeasurement")}
				</Button>
			</Flex>

			<Divider mb="sm" />

			<ScrollArea h={mainAreaHeight - 146} type="hover" scrollbarSize={6}>
				{isMeasurementsLoading ? (
					<Center h={120}>
						<Loader size="sm" />
					</Center>
				) : (
					<MantineTable withTableBorder withColumnBorders>
						<MantineTable.Thead bg="blue.0">
							<MantineTable.Tr>
								<MantineTable.Th w={50}>{t("S/N")}</MantineTable.Th>
								<MantineTable.Th>{t("QTY")}</MantineTable.Th>
								<MantineTable.Th>{t("Unit")}</MantineTable.Th>
								<MantineTable.Th w={120} ta="center">
									{t("Sales")}
								</MantineTable.Th>
								<MantineTable.Th w={120} ta="center">
									{t("Purchase")}
								</MantineTable.Th>
								<MantineTable.Th w={50} />
							</MantineTable.Tr>
						</MantineTable.Thead>
						<MantineTable.Tbody>
							{measurements.length === 0 ? (
								<MantineTable.Tr>
									<MantineTable.Td colSpan={6}>
										<Center h={60}>
											<Text c="dimmed" size="sm">
												{t("NothingFound")}
											</Text>
										</Center>
									</MantineTable.Td>
								</MantineTable.Tr>
							) : (
								measurements.map((measurement, index) => (
									<MantineTable.Tr key={measurement.id}>
										<MantineTable.Td>{index + 1}</MantineTable.Td>
										<MantineTable.Td>
											{measurement.quantity} {product?.unit_name}
										</MantineTable.Td>
										<MantineTable.Td>{measurement.unit_name}</MantineTable.Td>
										<MantineTable.Td ta="center">
											<Group justify="center">
												{loadingCheckboxKey === `${measurement.id}-is_sales` ? (
													<Loader size="xs" />
												) : (
													<Checkbox
														radius="lg"
														size="sm"
														className="cursor-pointer"
														checked={Boolean(measurement.is_sales)}
														onChange={() =>
															handleToggleSalesPurchase(
																measurement,
																"is_sales",
																Boolean(measurement.is_sales)
															)
														}
													/>
												)}
											</Group>
										</MantineTable.Td>
										<MantineTable.Td ta="center">
											<Group justify="center">
												{loadingCheckboxKey === `${measurement.id}-is_purchase` ? (
													<Loader size="xs" />
												) : (
													<Checkbox
														radius="lg"
														size="sm"
														className="cursor-pointer"
														checked={Boolean(measurement.is_purchase)}
														onChange={() =>
															handleToggleSalesPurchase(
																measurement,
																"is_purchase",
																Boolean(measurement.is_purchase)
															)
														}
													/>
												)}
											</Group>
										</MantineTable.Td>
										<MantineTable.Td ta="center">
											<ActionIcon
												color="red"
												variant="subtle"
												size="sm"
												onClick={() => handleDelete(measurement)}
											>
												<IconX size={16} />
											</ActionIcon>
										</MantineTable.Td>
									</MantineTable.Tr>
								))
							)}
						</MantineTable.Tbody>
					</MantineTable>
				)}
			</ScrollArea>

		</Box>
	);
}
