import React, { useEffect, useMemo } from "react";
import {
	Box,
	Button,
	Flex,
	Grid,
	Group,
	Image,
	NumberInput,
	Select,
	Stack,
	Switch,
	Text,
	Textarea,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconCheck, IconCurrencyTaka } from "@tabler/icons-react";
import useConfigData from "@hooks/useConfigData";
import VendorInfoSection from "./VendorInfoSection";
import useTransactionMode from "@hooks/useTransactionMode";
import { formatCurrency } from "@utils/index";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import { useHotkeys } from "@mantine/hooks";
import DateInputForm from "@components/form-builders/DateInputForm";

export default function PaymentSection({
	purchaseForm,
	itemsTotal,
	isAddingPurchase,
	isEditMode = false,
}) {
	const { transactionMode } = useTransactionMode();
	const { configData } = useConfigData();
	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const { discountAmount, isDiscountPercentage, purchaseDate, purchaseNarration, paymentAmount } =
		purchaseForm.values;

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
		if (purchaseForm.values.transactionModeId) return;

		const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
		if (cashMethod) {
			purchaseForm.setFieldValue("transactionModeId", String(cashMethod.id));
			purchaseForm.setFieldValue("transactionMode", cashMethod.name);
		}
	}, [transactionMode]);

	// =============== auto-populate payment amount with grand total ===============
	useEffect(() => {
		if (isEditMode) return;
		purchaseForm.setFieldValue("paymentAmount", grandTotal);
	}, [grandTotal]);

	const handleDiscountTypeChange = (value) => {
		purchaseForm.setFieldValue("isDiscountPercentage", value === "percentage");
		purchaseForm.setFieldValue("discountAmount", 0);
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

	useHotkeys([["alt+s", () => document.getElementById("PurchaseFormSubmit")?.click()]]);

	return (
		<>
			<Box bg={"gray.2"} p={"xs"}>
				<Grid columns={24} gutter={8}>
					<Grid.Col span={16}>
						<Grid columns={16} gutter={8}>
							<Grid.Col span={8}>
								<Box bd="1px solid #dee2e6" bg="white" p="xs" h="100%">
									<VendorInfoSection purchaseForm={purchaseForm} />
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
													opened={!!purchaseForm.errors.transactionModeId}
												>
													<Select
														data={groupedTransactionMode}
														renderOption={renderTransactionModeOption}
														searchable
														{...purchaseForm.getInputProps("transactionModeId", { type: "search" })}
														onChange={(value, option) => {
															purchaseForm.setFieldValue("transactionMode", option.label);
															purchaseForm.setFieldValue("transactionModeId", String(value));
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
												form={purchaseForm}
												id="expired_date"
												placeholder="DD-MM-YYYY"
												valueFormat="DD-MM-YYYY"
												clearable
												tooltip={purchaseForm.errors.purchaseDate}
												{...purchaseForm.getInputProps("purchaseDate")}
											/>
										</Grid.Col>
										<Grid.Col span={12}>
											<Textarea
												value={purchaseNarration}
												onChange={(event) =>
													purchaseForm.setFieldValue("purchaseNarration", event.currentTarget.value)
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
												<NumberInput
													value={discountAmount}
													onChange={(value) =>
														purchaseForm.setFieldValue("discountAmount", parseFloat(value) || 0)
													}
													hideControls
													size="sm"
													placeholder="0"
													leftSection={
														isDiscountPercentage ? (
															<Text fz={12}>%</Text>
														) : (
															<IconCurrencyTaka size={14} />
														)
													}
												/>
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
											opened={!!purchaseForm.errors.paymentAmount}
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
												{...purchaseForm.getInputProps("paymentAmount", { type: "number" })}
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
						id="PurchaseResetFormSubmit"
					>
						Reset
					</Button>
					<Button
						fullWidth
						bg="var(--theme-hold-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="PurchaseHoldFormSubmit"
					>
						Hold
					</Button>
					<Button
						fullWidth
						bg="var(--theme-print-btn-color)"
						color="white"
						radius={0}
						type="button"
						id="PurchasePrintFormSubmit"
					>
						Print
					</Button>
					<Button
						fullWidth
						bg="var(--theme-pos-btn-color)"
						color="white"
						radius={0}
						form="purchaseForm"
						type="submit"
						loading={isAddingPurchase}
						id="PurchaseFormSubmit"
					>
						{isEditMode ? "Update" : "Save"}
					</Button>
				</Button.Group>
			</Box>
		</>
	);
}
