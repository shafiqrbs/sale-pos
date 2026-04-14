import { useEffect, useMemo, useRef, useState } from "react";
import {
	Box,
	Button,
	Center,
	Divider,
	Grid,
	Group,
	Loader,
	Select,
	Table as MantineTable,
	Text,
	TextInput,
	ScrollArea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useGetInventoryParticularQuery } from "@services/settings.js";
import {
	useAddProductSkuMutation,
	useInlineUpdateProductSkuMutation,
	useLazyGetProductSkusQuery,
} from "@services/product.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight";

const INLINE_DEBOUNCE_MS = 600;

function SkuInlineInput({ skuId, field, initialValue, onUpdate }) {
	const [value, setValue] = useState(initialValue ?? "");

	// =============== keep local state in sync when parent reloads ================
	useEffect(() => {
		setValue(initialValue ?? "");
	}, [initialValue, skuId]);

	const debounced = useDebouncedCallback((nextValue) => {
		if (nextValue === (initialValue ?? "")) return;
		onUpdate({ skuId, field, value: nextValue });
	}, INLINE_DEBOUNCE_MS);

	return (
		<TextInput
			size="xs"
			value={value}
			onChange={(e) => {
				setValue(e.currentTarget.value);
				debounced(e.currentTarget.value);
			}}
		/>
	);
}

export default function SkuManagementTab({ product, productId }) {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	// =============== lazy load SKUs when this tab mounts ================
	const [triggerGetSkus, { data: skusResponse, isFetching: isSkuLoading }] =
		useLazyGetProductSkusQuery();

	useEffect(() => {
		if (productId) {
			triggerGetSkus(productId);
		}
	}, [productId, triggerGetSkus]);

	// =============== dropdown data - console log only, used for future UI ================
	const { data: colorData } = useGetInventoryParticularQuery({
		"dropdown-type": "color",
	});
	const { data: sizeData } = useGetInventoryParticularQuery({
		"dropdown-type": "size",
	});
	const { data: brandData } = useGetInventoryParticularQuery({
		"dropdown-type": "brand",
	});
	const { data: gradeData } = useGetInventoryParticularQuery({
		"dropdown-type": "product-grade",
	});
	const { data: modelData } = useGetInventoryParticularQuery({
		"dropdown-type": "model",
	});

	const sizeOptions = useMemo(
		() =>
			sizeData?.data?.map((item) => ({
				value: String(item.id),
				label: item.name,
			})) ?? [],
		[sizeData]
	);

	const skuRows = useMemo(() => {
		const data = skusResponse?.data;
		if (Array.isArray(data)) return data;
		if (Array.isArray(data?.data)) return data.data;
		return [];
	}, [skusResponse]);

	// =============== inline update ================
	const [inlineUpdateSku] = useInlineUpdateProductSkuMutation();

	const handleInlineUpdate = async ({ skuId, field, value }) => {
		try {
			const response = await inlineUpdateSku({
				skuId,
				body: { value, field },
			}).unwrap();
			const isSuccess = response?.status === 200 && response?.message === "success";
			if (!isSuccess) {
				showNotification(response?.message || t("UpdateFailed"), "red");
				return;
			}
			showNotification(t("UpdateSuccessfully"), "teal");
		} catch (error) {
			console.error(error);
			showNotification(error?.data?.message || t("UpdateFailed"), "red");
		}
	};

	// =============== add SKU form ================
	const addForm = useForm({
		initialValues: {
			product_id: String(productId ?? ""),
			color_id: "",
			brand_id: "",
			size_id: "",
			grade_id: "",
			model_id: "",
			barcode: "",
		},
	});

	const [addSku, { isLoading: isAddingSku }] = useAddProductSkuMutation();

	const handleAddSku = async (values) => {
		try {
			const response = await addSku({
				...values,
				product_id: String(productId),
			}).unwrap();
			const isSuccess = response?.status === 200 && response?.message === "success";
			if (!isSuccess) {
				showNotification(response?.message || t("CreateFailed"), "red");
				return;
			}
			showNotification(t("CreateSuccessfully"), "teal");
			addForm.reset();
			triggerGetSkus(productId);
		} catch (error) {
			console.error(error);
			showNotification(error?.data?.message || t("CreateFailed"), "red");
		}
	};

	return (
		<Box>
			<Text fw={600} size="md" mb="xs">
				{t("SkuManagement")}
			</Text>
			<Divider mb="sm" />

			<ScrollArea h={mainAreaHeight - 500} type="hover" scrollbarsize={6} scrollbars="y">
				<>
					{isSkuLoading ? (
						<Center h={120}>
							<Loader size="sm" />
						</Center>
					) : (
						<MantineTable striped withTableBorder withColumnBorders>
							<MantineTable.Thead>
								<MantineTable.Tr>
									<MantineTable.Th w={60}>{t("S/N")}</MantineTable.Th>
									<MantineTable.Th>{t("Name")}</MantineTable.Th>
									<MantineTable.Th w={200}>{t("Barcode")}</MantineTable.Th>
									<MantineTable.Th w={120}>{t("Size")}</MantineTable.Th>
									<MantineTable.Th w={140}>{t("PurchasePrice")}</MantineTable.Th>
									<MantineTable.Th w={140}>{t("SalesPrice")}</MantineTable.Th>
								</MantineTable.Tr>
							</MantineTable.Thead>
							<MantineTable.Tbody>
								{skuRows.length === 0 ? (
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
									skuRows.map((row, index) => (
										<MantineTable.Tr key={row.id ?? index}>
											<MantineTable.Td>{index + 1}</MantineTable.Td>
											<MantineTable.Td>
												{row.name ?? row.product_name ?? product?.product_name ?? "—"}
											</MantineTable.Td>
											<MantineTable.Td>
												<SkuInlineInput
													skuId={row.id}
													field="barcode"
													initialValue={row.barcode}
													onUpdate={handleInlineUpdate}
												/>
											</MantineTable.Td>
											<MantineTable.Td>{row.size_name ?? row.size ?? "—"}</MantineTable.Td>
											<MantineTable.Td>
												<SkuInlineInput
													skuId={row.id}
													field="purchase_price"
													initialValue={row.purchase_price}
													onUpdate={handleInlineUpdate}
												/>
											</MantineTable.Td>
											<MantineTable.Td>
												<SkuInlineInput
													skuId={row.id}
													field="sales_price"
													initialValue={row.sales_price}
													onUpdate={handleInlineUpdate}
												/>
											</MantineTable.Td>
										</MantineTable.Tr>
									))
								)}
							</MantineTable.Tbody>
						</MantineTable>
					)}
				</>
			</ScrollArea>

			<Box mt="lg">
				<Text fw={600} size="md" mb="xs">
					{t("AddStockKeepingUnit")}
				</Text>
				<Divider mb="sm" />
				<Box component="form" onSubmit={addForm.onSubmit(handleAddSku)}>
					<ScrollArea h={286} type="hover" scrollbarsize={6} scrollbars="y">
						<Grid columns={12} gutter="sm" align="center">
							<Grid.Col span={4}>
								<Text size="sm">{t("ProductBarcode")}</Text>
							</Grid.Col>
							<Grid.Col span={8}>
								<TextInput
									placeholder={t("Barcode")}
									size="sm"
									{...addForm.getInputProps("barcode")}
								/>
							</Grid.Col>

							<Grid.Col span={4}>
								<Text size="sm">{t("SelectSize")}</Text>
							</Grid.Col>
							<Grid.Col span={8}>
								<Select
									placeholder={t("ChooseSize")}
									size="sm"
									data={sizeOptions}
									searchable
									clearable
									{...addForm.getInputProps("size_id")}
								/>
							</Grid.Col>
						</Grid>
					</ScrollArea>
					<Button
						mt="md"
						type="submit"
						fullWidth
						size="md"
						color="blue"
						loading={isAddingSku}
						leftSection={<IconDeviceFloppy size={18} />}
					>
						{t("AddStockKeepingUnit")}
					</Button>
				</Box>
			</Box>
		</Box>
	);
}
