import React, { useEffect, useMemo } from "react";
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
	Tooltip,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { IconCurrencyTaka, IconPrinter, IconScissors, IconUserPlus } from "@tabler/icons-react";
import useConfigData from "@hooks/useConfigData";
import useTransactionMode from "@hooks/useTransactionMode";
import { formatCurrency, calculateVATAmount } from "@utils/index";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import useGetCoreCustomers from "@hooks/useGetCoreCustomers";
import SplitPaymentsDrawer from "@components/drawers/SplitPaymentsDrawer";

export default function PaymentSection({
	salesForm,
	itemsTotal,
	isAddingSales,
	onPosPrint,
	onReset,
}) {
	const { transactionMode } = useTransactionMode();
	const { configData } = useConfigData();

	const { coreCustomers } = useGetCoreCustomers();

	const customerOptions = coreCustomers?.map((customer) => ({
		value: String(customer.id),
		label: customer.name,
	})) ?? [];

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const { discountAmount, isDiscountPercentage, salesNarration, paymentAmount } =
		salesForm.values;

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

	const payments = salesForm.values.payments ?? [];
	const splitPaymentDrawerOpened = salesForm.values.splitPaymentDrawerOpened ?? false;
	const isSplitPaymentActive = payments.length > 1;

	// =============== set default payment mode (cash) once transaction modes are loaded ===============
	useEffect(() => {
		if (transactionMode?.length > 0 && payments.length === 0) {
			const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
			const defaultMethod = cashMethod || transactionMode[0];
			salesForm.setFieldValue("payments", [
				{
					transaction_mode_id: defaultMethod.id,
					transaction_mode_name: defaultMethod.name,
					amount: grandTotal,
				},
			]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [transactionMode]);

	// =============== auto-sync paymentAmount and single payment amount with grandTotal ===============
	useEffect(() => {
		if (!isSplitPaymentActive) {
			salesForm.setFieldValue("paymentAmount", grandTotal);
			if (payments.length === 1) {
				salesForm.setFieldValue("payments.0.amount", grandTotal);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [grandTotal, isSplitPaymentActive]);

	const handleSelectTransactionMode = (modeId, modeName) => {
		if (isSplitPaymentActive) return;
		salesForm.setFieldValue("payments", [
			{ transaction_mode_id: modeId, transaction_mode_name: modeName, amount: grandTotal },
		]);
	};

	const handleOpenSplitPaymentDrawer = () => {
		salesForm.setFieldValue("splitPaymentDrawerOpened", true);
	};

	const handleSaveSplitPayments = (splitPayments) => {
		const totalSplitAmount = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
		salesForm.setFieldValue("payments", splitPayments);
		salesForm.setFieldValue("paymentAmount", totalSplitAmount);
	};

	const clearSplitPayment = () => {
		const cashMethod = transactionMode?.find((mode) => mode.slug === "cash");
		const defaultMethod = cashMethod || transactionMode?.[0];
		salesForm.setFieldValue("payments", [
			{
				transaction_mode_id: defaultMethod?.id,
				transaction_mode_name: defaultMethod?.name,
				amount: grandTotal,
			},
		]);
		salesForm.setFieldValue("paymentAmount", grandTotal);
	};

	const handleDiscountTypeChange = (value) => {
		salesForm.setFieldValue("isDiscountPercentage", value === "percentage");
		salesForm.setFieldValue("discountAmount", 0);
	};

	return (
		<>
			{/* =============== summary info bar — same layout as POS TransactionInformation =============== */}


			<Grid columns={24} gutter={8} mt="xs">
				<Grid.Col span={16}>
					<Grid columns={16} gutter={8}>
						{/* <Grid.Col span={16}>
							<CustomerInfoSection salesForm={salesForm} />
						</Grid.Col> */}
						<Grid.Col span={7}>
							<Box bd="1px solid #dee2e6" bg="white" p="xs" className="borderRadiusAll">
								<Grid gutter={6}>
									<Grid.Col span={12}>
										<Select
											placeholder="Search customer (optional)"
											data={customerOptions}
											searchable
											clearable
											value={salesForm.values.customer_id || null}
											onChange={(value) => salesForm.setFieldValue("customer_id", value ?? "")}
											nothingFoundMessage="No customer found"
											rightSection={<ActionIcon>
												<IconUserPlus size={16} />
											</ActionIcon>}
										/>
									</Grid.Col>
									<Grid.Col span={12}>
										<Textarea
											value={salesNarration}
											onChange={(event) =>
												salesForm.setFieldValue(
													"salesNarration",
													event.currentTarget.value
												)
											}
											placeholder="Narration"
											size="xs"
											minRows={2}
										/>
									</Grid.Col>
								</Grid>
							</Box>
						</Grid.Col>
						<Grid.Col span={9}>
							<Grid columns={13} gutter={4} justify="center" align="center" pb={4} bg="gray.1" mt="xs">
								<Grid.Col span={7} px={4}>
									<Grid bg="gray.1" px={4}>
										<Grid.Col span={6}>
											<Stack gap={0}>
												<Group justify="space-between" gap={0}>
													<Text fz="sm" fw={500} c="black">
														DIS.
													</Text>
													<Text fz="sm" fw={800} c="black">
														{currencySymbol} {formatCurrency(discountValue)}
													</Text>
												</Group>
												<Group justify="space-between">
													<Text fz="sm" fw={500} c="black">
														Type
													</Text>
													<Text fz="sm" fw={800} c="black">
														{isDiscountPercentage ? "Percent" : "Flat"}
													</Text>
												</Group>
											</Stack>
										</Grid.Col>
										<Grid.Col span={6}>
											<Group justify="space-between">
												<Text fz="sm" fw={500} c="black">
													VAT {configData?.inventory_config?.config_vat?.vat_percent}%
												</Text>
												<Text fz="sm" fw={800} c="black">
													{calculateVATAmount(itemsTotal, configData?.inventory_config?.config_vat)}
												</Text>
											</Group>
											<Group justify="space-between">
												<Text fz="sm" fw={500} c="black">
													SD
												</Text>
												<Text fz="sm" fw={800} c="black">
													{currencySymbol} 0
												</Text>
											</Group>
										</Grid.Col>
									</Grid>
								</Grid.Col>
								<Grid.Col span={3}>
									<Stack gap={0} align="center" justify="center" bg="gray.8" py={4} bdrs={4}>
										<Text fw={800} c="white" size="lg">
											{currencySymbol} {grandTotal?.toFixed(2)}
										</Text>
										<Text fw={500} c="white" size="md">
											Total
										</Text>
									</Stack>
								</Grid.Col>
								<Grid.Col span={3}>
									<Stack gap={0} align="center" justify="center" bg="red" py={4} bdrs={4}>
										<Text fw={800} c="white" size="lg">
											{currencySymbol} {dueAmount?.toFixed(2)}
										</Text>
										<Text fw={500} c="white" size="md">
											Due
										</Text>
									</Stack>
								</Grid.Col>
							</Grid>

							<Box bd="1px solid #dee2e6" bg="white" p="xs" className="borderRadiusAll" h="100%">
								<Grid columns={24} gutter={2} align="center" justify="center" mb={4}>
									<Grid.Col span={21}>
										<Tooltip
											label="Transaction mode is required"
											opened={!!salesForm.errors.payments}
											px={16}
											py={2}
											bg="orange.8"
											c="white"
											withArrow
											offset={{ mainAxis: 5, crossAxis: -364 }}
											zIndex={999}
											transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
										>
											<Carousel
												id="sales-transaction-mode-carousel"
												slideSize="20%"
												slideGap="es"
												align="start"
												height={60}
												withIndicators={false}
												controlSize={28}
												controlsOffset={2}
												emblaOptions={{ align: "start", slidesToScroll: 3 }}
											>
												{transactionMode?.map((mode) => (
													<Carousel.Slide key={mode.id}>
														<Box
															onClick={() => handleSelectTransactionMode(mode.id, mode.name)}
															pos="relative"
															className={
																isSplitPaymentActive ? "cursor-not-allowed" : "cursor-pointer"
															}
														>
															<Flex
																bg={
																	payments.length === 1 &&
																	payments[0]?.transaction_mode_id === mode.id
																		? "green.8"
																		: "white"
																}
																direction="column"
																align="center"
																justify="center"
																c="black"
																p={3}
															>
																<Tooltip
																	label={mode.name}
																	withArrow
																	px={16}
																	py={2}
																	offset={2}
																	zIndex={999}
																	position="top"
																	color="red"
																>
																	<Image
																		w={80}
																		fit="contain"
																		alt={mode.name}
																		src={mode.path}
																		fallbackSrc={`https://placehold.co/120x80/FFFFFF/2f9e44?text=${mode.name}`}
																	/>
																</Tooltip>
															</Flex>
														</Box>
													</Carousel.Slide>
												))}
											</Carousel>
										</Tooltip>
									</Grid.Col>
									<Grid.Col span={3} style={{ textAlign: "right" }} pr="8">
										<Tooltip
											label="Split payment"
											px={16}
											py={2}
											bg="gray.8"
											c="white"
											withArrow
											zIndex={999}
											transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
										>
											<ActionIcon
												size="xl"
												bg={isSplitPaymentActive ? "green.6" : "gray.8"}
												variant="filled"
												onClick={handleOpenSplitPaymentDrawer}
												disabled={!salesForm.values.paymentAmount}
											>
												<IconScissors style={{ width: "70%", height: "70%" }} stroke={1.5} />
											</ActionIcon>
										</Tooltip>
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
						{/* =============== totals summary tiles =============== */}
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

						{/* =============== discount input with flat/percentage toggle =============== */}
						<Flex mt="xs" justify="space-between" align="center" gap={6}>
							<Text fz="sm" fw={600} style={{ whiteSpace: "nowrap" }}>
								Discount:
							</Text>
							<Select
								size="xs"
								w={120}
								data={[
									{ value: "flat", label: "Flat" },
									{ value: "percentage", label: "%" },
								]}
								value={isDiscountPercentage ? "percentage" : "flat"}
								onChange={handleDiscountTypeChange}
								allowDeselect={false}
							/>
							<Box style={{ flex: 1 }}>
								<NumberInput
									value={discountAmount}
									onChange={(value) =>
										salesForm.setFieldValue("discountAmount", parseFloat(value) || 0)
									}
									hideControls
									size="xs"
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

						{/* =============== due amount display and receivable input =============== */}
						<Flex
							mt="xs"
							direction="column"
							gap={6}
							bg="var(--theme-primary-color-1)"
							className="borderRadiusAll"
							px="xs"
							py={6}
						>
							<Flex py={8} justify="space-between" align="center">
								<Text fz="sm" fw={600}>
									Due
								</Text>
								<Flex align="center" gap={4}>
									<Text fz="sm" fw={500}>
										{currencySymbol}
									</Text>
									<Text fz="sm" fw={700}>
										{formatCurrency(dueAmount)}
									</Text>
								</Flex>
							</Flex>
							<FormValidationWrapper
								errorMessage="Payment amount is required"
								opened={!!salesForm.errors.paymentAmount}
							>
								<NumberInput
									hideControls
									size="sm"
									placeholder="Receivable amount"
									leftSection={<IconCurrencyTaka size={14} />}
									styles={{
										input: {
											backgroundColor: "white",
										},
									}}
									{...salesForm.getInputProps("paymentAmount", { type: "number" })}
								/>
							</FormValidationWrapper>
						</Flex>
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
					onClick={onReset}
				>
					Reset
				</Button>
				<Button
					fullWidth
					bg="var(--theme-pos-btn-color)"
					color="white"
					radius={0}
					type="button"
					leftSection={<IconPrinter size={16} />}
					onClick={onPosPrint}
					loading={isAddingSales}
				>
					POS Print
				</Button>
				<Button
					fullWidth
					bg="var(--theme-save-btn-color)"
					color="white"
					radius={0}
					form="salesForm"
					type="submit"
					loading={isAddingSales}
				>
					Save
				</Button>
			</Button.Group>

			{/* =============== split payments drawer =============== */}
			<SplitPaymentsDrawer
				opened={splitPaymentDrawerOpened}
				onClose={() => salesForm.setFieldValue("splitPaymentDrawerOpened", false)}
				totalAmount={grandTotal}
				onSave={handleSaveSplitPayments}
				onRemove={clearSplitPayment}
				existingSplitPayments={payments}
			/>
		</>
	);
}
