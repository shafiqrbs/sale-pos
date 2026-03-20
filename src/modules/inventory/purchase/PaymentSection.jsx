import { useEffect, useMemo } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Grid,
	Group,
	Image,
	NumberInput,
	Select,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { IconCheck, IconCurrencyTaka, IconNumber123, IconPercentage } from "@tabler/icons-react";
import useConfigData from "@hooks/useConfigData";
import VendorInfoSection from "./VendorInfoSection";
import useTransactionMode from "@hooks/useTransactionMode";
import { formatCurrency } from "@utils/index";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import { useHotkeys } from "@mantine/hooks";
import DateInputForm from "@components/form-builders/DateInputForm";

export default function PaymentSection({
	itemsForm,
	itemsTotal,
	isAddingItem,
	isEditMode = false,
}) {
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
	}, [ discountAmount, isDiscountPercentage, itemsTotal ]);

	const grandTotal = useMemo(
		() => Math.max(itemsTotal - discountValue + vatAmount, 0),
		[ itemsTotal, discountValue ]
	);

	const dueAmount = useMemo(
		() => Math.max(grandTotal - (paymentAmount || 0), 0),
		[ grandTotal, paymentAmount ]
	);

	// =============== group transaction modes by method_name ===============
	const groupedTransactionMode = useMemo(() => {
		if (!transactionMode?.length) return [];

		const groupsMap = {};
		transactionMode.forEach((mode) => {
			const methodName = mode.method_name || "Others";
			if (!groupsMap[ methodName ]) {
				groupsMap[ methodName ] = [];
			}
			groupsMap[ methodName ].push({
				value: String(mode.id),
				label: mode.name,
				path: mode.path,
			});
		});

		return Object.entries(groupsMap).map(([ group, items ]) => ({
			group,
			items,
		}));
	}, [ transactionMode ]);

	// =============== auto-set cash transaction mode on load ===============
	useEffect(() => {
		if (!transactionMode?.length || isEditMode) return;
		if (itemsForm.values.transactionModeId) return;

		const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
		if (cashMethod) {
			itemsForm.setFieldValue("transactionModeId", String(cashMethod.id));
			itemsForm.setFieldValue("transactionMode", cashMethod.name);
		}
	}, [ transactionMode ]);

	// =============== auto-populate payment amount with grand total ===============
	useEffect(() => {
		if (isEditMode) return;
		itemsForm.setFieldValue("paymentAmount", grandTotal);
	}, [ grandTotal ]);

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

	useHotkeys([ [ "alt+s", () => document.getElementById("ItemsFormSubmit")?.click() ] ]);

	return (
		<>
			<Box bg={"gray.2"} p={"xs"}>
				<Grid columns={24} gutter={8}>
					<Grid.Col span={16}>
						<Grid columns={16} gutter={8}>
							<Grid.Col span={8}>
								<Box bd="1px solid #dee2e6" bg="white" p="xs" h="100%">
									<VendorInfoSection itemsForm={itemsForm} />
								</Box>
							</Grid.Col>

							<Grid.Col span={8}>
								<Box bd="1px solid #dee2e6" bg="white" p="xs" className="borderRadiusAll">
									<Grid gutter={6}>
										<Grid.Col span={12}>
											<Box bg="white" h="100%">
												<Text fz="sm" fw={600} mb={6}>
													Transaction mode
												</Text>
												<FormValidationWrapper
													errorMessage="Transaction mode is required"
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
														nothingFoundMessage="No transaction mode found"
														placeholder="Select transaction mode"
														size="sm"
													/>
												</FormValidationWrapper>
											</Box>
										</Grid.Col>
										<Grid.Col span={12}>
											<DateInputForm
												name="purchaseDate"
												form={itemsForm}
												id="expired_date"
												placeholder="DD-MM-YYYY"
												valueFormat="DD-MM-YYYY"
												clearable
												tooltip={itemsForm.errors.purchaseDate}
												{...itemsForm.getInputProps("purchaseDate")}
											/>
										</Grid.Col>
										<Grid.Col span={12}>
											<Textarea
												value={purchaseNarration}
												onChange={(event) =>
													itemsForm.setFieldValue("purchaseNarration", event.currentTarget.value)
												}
												placeholder="Narration"
												size="xs"
												minRows={2}
											/>
										</Grid.Col>
									</Grid>
								</Box>
							</Grid.Col>
						</Grid>
					</Grid.Col>
					<Grid.Col span={8}>
						<Stack
							bd="1px solid #dee2e6"
							bg="white"
							p="xs"
							className="borderRadiusAll"
							h="100%"
							justify="space-between"
							gap={0}
						>
							<Grid columns={24} gutter={{ base: 4 }}>
								<Grid.Col span={8} h={66}>
									<Flex
										align="center"
										justify="center"
										bg="var(--theme-primary-color-1)"
										className="borderRadiusAll"
										px="xs"
										py={4}
										h="100%"
										direction="column"
									>
										<Text ta="center" fz={12} fw={500}>
											Discount
										</Text>
										<Flex justify="center" align="center" gap={4}>
											<Text fz={11}>{currencySymbol}</Text>
											<Text fz={12} fw={600}>
												{formatCurrency(discountValue)}
											</Text>
										</Flex>
										<Text fz={10} c="dimmed">
											{isDiscountPercentage ? "Percent" : "Flat"}
										</Text>
									</Flex>
								</Grid.Col>
								<Grid.Col span={8}>
									<Flex
										align="center"
										justify="center"
										bg="var(--theme-primary-color-1)"
										className="borderRadiusAll"
										px="xs"
										py="les"
										h="100%"
										direction="column"
									>
										<Text fz={12} fw={500}>
											Vat
										</Text>
										<Flex align="center" gap={4}>
											<Text fz={11}>{currencySymbol}</Text>
											<Text fz={12} fw={600}>
												{formatCurrency(vatAmount)}
											</Text>
										</Flex>
									</Flex>
								</Grid.Col>
								<Grid.Col span={8}>
									<Flex
										align="center"
										justify="center"
										bg="var(--theme-primary-color-1)"
										className="borderRadiusAll"
										px="xs"
										py="les"
										h="100%"
										direction="column"
									>
										<Text fz={12} fw={500}>
											Total
										</Text>
										<Flex align="center" gap={4}>
											<Text fz={11}>{currencySymbol}</Text>
											<Text fz={12} fw={700}>
												{formatCurrency(grandTotal)}
											</Text>
										</Flex>
									</Flex>
								</Grid.Col>
							</Grid>
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
												Discount
											</Text>
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
										<Flex py={8} justify="space-between" align="center">
											<Text fz="sm" c={"white"} fw={600}>
												Due
											</Text>
											<Flex align="center" gap={4}>
												<Text fz="sm" c={"white"} fw={500}>
													{currencySymbol}
												</Text>
												<Text fz="sm" c={"white"} fw={700}>
													{formatCurrency(dueAmount)}
												</Text>
											</Flex>
										</Flex>
										<FormValidationWrapper
											errorMessage="Payment amount is required"
											opened={!!itemsForm.errors.paymentAmount}
										>
											<NumberInput
												hideControls
												size="sm"
												placeholder="Amount"
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
						</Stack>
					</Grid.Col>
				</Grid>

				<Button.Group mt="xs">
					<Button
						fullWidth
						bg="var(--theme-reset-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="ItemsResetFormSubmit"
					>
						Reset
					</Button>
					<Button
						fullWidth
						bg="var(--theme-hold-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="ItemsHoldFormSubmit"
					>
						Hold
					</Button>
					<Button
						fullWidth
						bg="var(--theme-print-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="ItemsPrintFormSubmit"
					>
						Print
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
						{isEditMode ? "Update" : "Save"}
					</Button>
				</Button.Group>
			</Box>
		</>
	);
}
