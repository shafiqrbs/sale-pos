import { useEffect, useMemo } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Card,
	Flex,
	Grid,
	Group,
	Image,
	NumberInput,
	Select,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { IconCheck, IconCurrencyTaka, IconNumber123, IconPercentage } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import VendorInfoSection from "./VendorInfoSection";
import useTransactionMode from "@hooks/useTransactionMode";
import { formatCurrency } from "@utils/index";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import { useHotkeys } from "@mantine/hooks";

export default function PaymentSection({
	itemsForm,
	itemsTotal,
	isAddingItem,
	isEditMode = false,
}) {
	const { t } = useTranslation();
	const { transactionMode } = useTransactionMode();
	const { currencySymbol } = useConfigData();

	const { discountAmount, isDiscountPercentage, purchaseNarration, paymentAmount } =
		itemsForm.values;

	const vatAmount = 0;

	const discountValue = useMemo(() => {
		if (!discountAmount) {
			return 0;
		}

		if (isDiscountPercentage) {
			return (itemsTotal * discountAmount) / 100;
		}

		return discountAmount;
	}, [discountAmount, isDiscountPercentage, itemsTotal]);

	const grandTotal = useMemo(
		() => Math.max(itemsTotal - discountValue + vatAmount, 0),
		[itemsTotal, discountValue]
	);

	const dueAmount = useMemo(
		() => Math.max(grandTotal - (paymentAmount || 0), 0),
		[grandTotal, paymentAmount]
	);

	// =============== group transaction modes by method_name ===============
	const groupedTransactionMode = useMemo(() => {
		if (!transactionMode?.length) return [];

		const groupsMap = {};
		transactionMode.forEach((mode) => {
			const methodName = mode.method_name || "Others";
			if (!groupsMap[methodName]) {
				groupsMap[methodName] = [];
			}
			groupsMap[methodName].push({
				value: String(mode.id),
				label: mode.name,
				path: mode.path,
			});
		});

		return Object.entries(groupsMap).map(([group, items]) => ({
			group,
			items,
		}));
	}, [transactionMode]);

	// =============== auto-set cash transaction mode on load ===============
	useEffect(() => {
		if (!transactionMode?.length || isEditMode) return;
		if (itemsForm.values.transactionModeId) return;

		const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
		if (cashMethod) {
			itemsForm.setFieldValue("transactionModeId", String(cashMethod.id));
			itemsForm.setFieldValue("transactionMode", cashMethod.name);
		}
	}, [transactionMode]);

	// =============== auto-populate payment amount with grand total ===============
	useEffect(() => {
		if (isEditMode) return;
		itemsForm.setFieldValue("paymentAmount", grandTotal);
	}, [grandTotal]);

	// =============== toggle between flat and percentage discount; reset amount on switch ===============
	const toggleDiscountType = () => {
		itemsForm.setFieldValue("discountAmount", 0);
		itemsForm.setFieldValue("isDiscountPercentage", !isDiscountPercentage);
	};

	// =============== render option with image and label ===============
	const iconProps = { stroke: 1.5, color: "currentColor", opacity: 0.6, size: 18 };
	const renderTransactionModeOption = ({ option, checked }) => (
		<Group flex="1" gap="xs">
			<Image
				w={34}
				h={24}
				bd="1px solid #2f9e44"
				fit="contain"
				alt={option.label}
				src={option.path}
				radius="sm"
				fallbackSrc={`https://placehold.co/60x60/FFFFFF/2f9e44?text=${encodeURIComponent(option.label || "")}`}
			/>
			{option.label}
			{checked && <IconCheck style={{ marginInlineStart: "auto" }} {...iconProps} />}
		</Group>
	);

	useHotkeys([
		["alt+s", () => document.getElementById("ItemsFormSubmit")?.click()],
		["alt+h", () => document.getElementById("ItemsHoldFormSubmit")?.click()],
		["alt+p", () => document.getElementById("ItemsPrintFormSubmit")?.click()],
		["alt+r", () => document.getElementById("ItemsResetFormSubmit")?.click()],
	]);

	return (
		<>
			<Box bg={"gray.2"} p={"xs"}>
				<SimpleGrid cols={{ base: 1, md: 3 }} mt="xs">
					<Card padding="xs">
						<Box>
							<VendorInfoSection itemsForm={itemsForm} />
						</Box>
					</Card>
					<Card padding="xs">
						<Box>
							<Grid gutter={6}>
								<Grid.Col span={4}>
									<Text fz="sm" fw={600} mt={6}>
										{t("PaymentMode")}
									</Text>
								</Grid.Col>
								<Grid.Col span={8}>
									<Box bg="white" h="100%">
										<FormValidationWrapper
											errorMessage={t("TransactionModeRequired")}
											opened={!!itemsForm.errors.transactionModeId}
										>
											<Select
												data={groupedTransactionMode}
												renderOption={renderTransactionModeOption}
												searchable
												{...itemsForm.getInputProps("transactionModeId", { type: "search" })}
												onChange={(value, option) => {
													itemsForm.setFieldValue("transactionMode", option.label);
													itemsForm.setFieldValue("transactionModeId", String(value));
												}}
												nothingFoundMessage={t("NoTransactionModeFound")}
												placeholder={t("SelectTransactionMode")}
												size="sm"
											/>
										</FormValidationWrapper>
									</Box>
								</Grid.Col>
								<Grid.Col span={12}>
									<Textarea
										value={purchaseNarration}
										onChange={(event) =>
											itemsForm.setFieldValue("purchaseNarration", event.currentTarget.value)
										}
										placeholder={t("Narration")}
										size="xs"
										minRows={2}
									/>
								</Grid.Col>
							</Grid>
						</Box>
					</Card>
					<Card padding="xs">
						<Grid columns={24} gutter={{ base: 1 }}>
							<Grid.Col span={12}>
								<Flex
									direction="column"
									gap={6}
									className="borderRadiusAll"
									px="xs"
									py={6}
									bg={"#fffbeb85"}
								>
									<Flex py={8} justify="space-between" align="center">
										<Text fz="sm" fw={600}>
											{t("Discount")}
										</Text>
										<Flex align="center" gap={4}>
											<Flex justify="center" align="center" gap={4}>
												<Text fz={11}>{currencySymbol}</Text>
												<Text fz={12} fw={600}>
													{formatCurrency(discountValue)}
												</Text>
											</Flex>
											<Text fz={10} c="dimmed">
												{isDiscountPercentage ? t("Percent") : t("Flat")}
											</Text>
										</Flex>
									</Flex>
									<Flex justify="space-between" align="center" gap={4}>
										<Box style={{ flex: 1 }}>
											{isDiscountPercentage ? (
												<NumberInput
													value={discountAmount}
													onChange={(value) =>
														itemsForm.setFieldValue("discountAmount", parseFloat(value) || 0)
													}
													hideControls
													size="sm"
													placeholder="0"
													suffix="%"
													max={99}
													min={0}
													allowNegative={false}
													decimalScale={2}
													rightSection={
														<ActionIcon
															size={32}
															bg="violet.5"
															variant="filled"
															mr={10}
															onClick={toggleDiscountType}
														>
															<IconPercentage size={16} />
														</ActionIcon>
													}
												/>
											) : (
												<NumberInput
													value={discountAmount}
													onChange={(value) =>
														itemsForm.setFieldValue("discountAmount", parseFloat(value) || 0)
													}
													hideControls
													size="sm"
													placeholder="0"
													leftSection={<IconCurrencyTaka size={14} />}
													rightSection={
														<ActionIcon
															size={32}
															bg="red.5"
															variant="filled"
															mr={10}
															onClick={toggleDiscountType}
														>
															<IconNumber123 size={16} />
														</ActionIcon>
													}
												/>
											)}
										</Box>
									</Flex>
								</Flex>
							</Grid.Col>
							<Grid.Col span={12}>
								<Flex
									direction="column"
									gap={6}
									bg="var(--theme-primary-card-color)"
									color={"white"}
									className="borderRadiusAll"
									px="xs"
									py={6}
								>
									<Flex py={8} gap="sm" justify="space-between" align="center">
										<Text fz="sm" c={"white"} fw={600}>
											{t("Due")}
										</Text>
										<NumberInput
											hideControls
											size="sm"
											placeholder={t("Due")}
											thousandSeparator=","
											leftSection={<IconCurrencyTaka size={14} />}
											value={dueAmount}
											styles={{
												input: {
													backgroundColor: "white",
												},
											}}
										/>
									</Flex>

									<FormValidationWrapper
										errorMessage={t("PaymentAmountRequired")}
										opened={!!itemsForm.errors.paymentAmount}
									>
										<NumberInput
											hideControls
											size="sm"
											placeholder={t("Amount")}
											thousandSeparator=","
											leftSection={<IconCurrencyTaka size={14} />}
											styles={{
												input: {
													backgroundColor: "white",
												},
											}}
											{...itemsForm.getInputProps("paymentAmount", { type: "number" })}
										/>
									</FormValidationWrapper>
								</Flex>
							</Grid.Col>
						</Grid>
					</Card>
				</SimpleGrid>
				<Button.Group mt="xs">
					<Button
						fullWidth
						bg="var(--theme-reset-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="ItemsResetFormSubmit"
					>
						<Stack gap={0}>
							{t("Reset")}{" "}
							<Text size="xs" component="span">
								alt+r
							</Text>
						</Stack>
					</Button>
					<Button
						fullWidth
						bg="var(--theme-hold-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="ItemsHoldFormSubmit"
					>
						<Stack gap={0}>
							{t("Hold")}{" "}
							<Text size="xs" component="span">
								alt+h
							</Text>
						</Stack>
					</Button>
					<Button
						fullWidth
						bg="var(--theme-print-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="ItemsPrintFormSubmit"
					>
						<Stack gap={0}>
							{t("Print")}{" "}
							<Text size="xs" component="span">
								alt+p
							</Text>
						</Stack>
					</Button>
					<Button
						fullWidth
						bg="var(--theme-pos-btn-color)"
						color="white"
						radius={0}
						form="itemsForm"
						type="submit"
						loading={isAddingItem}
						id="ItemsFormSubmit"
					>
						<Stack gap={0}>
							{isEditMode ? t("Update") : t("Save")}{" "}
							<Text size="xs" component="span">
								alt+s
							</Text>
						</Stack>
					</Button>
				</Button.Group>
			</Box>
		</>
	);
}
