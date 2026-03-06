import React, { useEffect, useMemo, useState } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Grid,
	Group,
	Image,
	NumberInput,
	Stack,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure } from "@mantine/hooks";
import {
	IconCurrencyTaka,
	IconNumber123,
	IconPercentage,
	IconPlusMinus,
	IconPrinter,
	IconScissors,
	IconTicket,
	IconUserPlus,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import useTransactionMode from "@hooks/useTransactionMode";
import { formatCurrency, calculateVATAmount } from "@utils/index";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import SplitPaymentsDrawer from "@components/drawers/SplitPaymentsDrawer";
import CustomerDrawer from "@components/drawers/CustomerDrawer";

export default function PaymentSection({
	salesForm,
	itemsTotal,
	isAddingSales,
	onPosPrint,
	onReset,
	resetKey = 0,
}) {
	const { t } = useTranslation();
	const { transactionMode } = useTransactionMode();
	const { configData } = useConfigData();

	const [ customerObject, setCustomerObject ] = useState(null);
	const [ customersDropdownData, setCustomersDropdownData ] = useState([]);
	const [ discountMode, setDiscountMode ] = useState("discount");
	const [ percentageValue, setPercentageValue ] = useState(0);
	const [ customerDrawerOpened, { open: customerDrawerOpen, close: customerDrawerClose } ] =
		useDisclosure(false);

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	const { discount_type, discount, coupon_code, salesNarration, paymentAmount } =
		salesForm.values;

	const vatAmount = 0;

	// =============== discount value: when flat/percentage use form discount; when coupon use 0 ===============
	const discountValue = useMemo(() => {
		if (discount_type === "coupon") return 0;
		return Number(discount) || 0;
	}, [ discount_type, discount ]);

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
			const defaultMethod = cashMethod || transactionMode[ 0 ];
			salesForm.setFieldValue("payments", [
				{
					transaction_mode_id: defaultMethod.id,
					transaction_mode_name: defaultMethod.name,
					amount: grandTotal,
				},
			]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ transactionMode ]);

	// =============== auto-sync paymentAmount and single payment amount with grandTotal ===============
	useEffect(() => {
		if (!isSplitPaymentActive) {
			salesForm.setFieldValue("paymentAmount", grandTotal);
			if (payments.length === 1) {
				salesForm.setFieldValue("payments.0.amount", grandTotal);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ grandTotal, isSplitPaymentActive ]);

	// =============== fetch customers for drawer ===============
	async function fetchCustomers() {
		const data = await window.dbAPI.getDataFromTable("core_customers");
		setCustomersDropdownData(data ?? []);
	}

	useEffect(() => {
		fetchCustomers();
	}, []);

	useEffect(() => {
		if (!customerDrawerOpened) {
			fetchCustomers();
		}
	}, [ customerDrawerOpened ]);

	// =============== reset local state when parent triggers reset ===============
	useEffect(() => {
		setCustomerObject(null);
		setDiscountMode("discount");
		setPercentageValue(0);
	}, [ resetKey ]);

	const handleCustomerSelect = (customer) => {
		if (customer) {
			setCustomerObject(customer);
			salesForm.setFieldValue("customer_id", customer.id?.toString());
		} else {
			setCustomerObject(null);
			salesForm.setFieldValue("customer_id", "");
		}
	};

	const handleCustomerAdd = () => {
		customerDrawerOpen();
	};

	const handlePercentageChange = (value) => {
		setPercentageValue(value);
		const discountAmount = (Math.round(itemsTotal) * value) / 100;
		salesForm.setFieldValue("discount", Math.round(discountAmount));
	};

	const handleDiscountModeChange = () => {
		if (discountMode === "coupon") {
			setDiscountMode("discount");
			salesForm.setFieldValue("discount_type", "flat");
			salesForm.setFieldValue("coupon_code", "");
		} else {
			setDiscountMode("coupon");
			salesForm.setFieldValue("discount_type", "coupon");
			salesForm.setFieldValue("discount", 0);
		}
	};

	const toggleDiscountMode = () => {
		salesForm.setFieldValue("discount", 0);
		setPercentageValue(0);
		const newType = discount_type === "flat" ? "percentage" : "flat";
		salesForm.setFieldValue("discount_type", newType);
	};

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
		const defaultMethod = cashMethod || transactionMode?.[ 0 ];
		salesForm.setFieldValue("payments", [
			{
				transaction_mode_id: defaultMethod?.id,
				transaction_mode_name: defaultMethod?.name,
				amount: grandTotal,
			},
		]);
		salesForm.setFieldValue("paymentAmount", grandTotal);
	};

	return (
		<>
			<Grid columns={24} gutter={8} mt="xs">
				<Grid.Col span={16}>
					<Grid columns={16} gutter={8}>
						<Grid.Col span={7}>
							<Box bd="1px solid #dee2e6" bg="white" p="xs" className="borderRadiusAll">
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
														{discount_type === "percentage"
															? "Percent"
															: discount_type === "coupon"
																? "Coupon"
																: "Flat"}
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
																		payments[ 0 ]?.transaction_mode_id === mode.id
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
						{/* <Grid columns={24} gutter={{ base: 4 }}>
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
						</Grid> */}
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
						</Flex>
						<Grid columns={24} gutter={{ base: 8 }} pr="2px" align="center" justify="center">
							<Grid.Col span={6}>
								<FormValidationWrapper
									errorMessage={t("ChooseCustomer")}
									opened={!!salesForm.errors.customer_id}
								>
									<Button
										fullWidth
										size="sm"
										color="#0077b6"
										px="2xs"
										leftSection={
											customerObject?.name ? (
												<></>
											) : (
												<IconUserPlus height={14} width={14} stroke={2} />
											)
										}
										onClick={handleCustomerAdd}
									>
										<Stack gap={0}>
											<Text fw={600} size="xs">
												{customerObject?.name ? customerObject?.name : t("Customer")}
											</Text>
											<Text size="xs">{customerObject?.mobile ?? ""}</Text>
										</Stack>
									</Button>
								</FormValidationWrapper>
							</Grid.Col>
							<Grid.Col span={6}>
								<FormValidationWrapper
									errorMessage={t("ClickRightButtonForPercentFlat")}
									opened={!!salesForm.errors.coupon_code}
								>
									<Button
										fullWidth
										onClick={handleDiscountModeChange}
										variant="filled"
										px="2xs"
										fz="xs"
										leftSection={
											discountMode === "coupon" ? (
												<IconTicket size={14} />
											) : (
												<IconPercentage size={14} />
											)
										}
										color="gray"
									>
										{discountMode === "coupon" ? t("Coupon") : t("Discount")}
									</Button>
								</FormValidationWrapper>
							</Grid.Col>
							<Grid.Col
								span={6}
								bg={
									discount_type === "flat"
										? "red.3"
										: discount_type === "percentage"
											? "violet.3"
											: "gray.3"
								}
							>
								{discountMode === "coupon" ? (
									<TextInput
										type="text"
										placeholder={t("CouponCode")}
										value={coupon_code}
										error={salesForm.errors.coupon_code}
										size="sm"
										onChange={(event) => {
											salesForm.setFieldValue("coupon_code", event.target.value);
										}}
										rightSection={
											<FormValidationWrapper
												errorMessage={t("CouponCode")}
												opened={!!salesForm.errors.coupon_code}
												position="left"
											>
												<IconTicket size={16} opacity={0.5} />
											</FormValidationWrapper>
										}
									/>
								) : (
									<FormValidationWrapper
										errorMessage={t("ClickRightButtonForPercentFlat")}
										opened={!!salesForm.errors.discount}
										position="left"
									>
										{discount_type === "flat" ? (
											<NumberInput
												placeholder={t("Discount")}
												value={discount}
												error={salesForm.errors.discount}
												size="sm"
												onChange={(value) => salesForm.setFieldValue("discount", value)}
												rightSection={
													<ActionIcon
														size={32}
														bg="red.5"
														variant="filled"
														mr={10}
														onClick={toggleDiscountMode}
													>
														<IconPercentage size={16} />
													</ActionIcon>
												}
											/>
										) : (
											<NumberInput
												placeholder={t("Discount")}
												value={percentageValue}
												error={salesForm.errors.discount}
												size="sm"
												suffix="%"
												max={100}
												min={0}
												allowNegative={false}
												step={1}
												decimalScale={2}
												hideControls
												onChange={handlePercentageChange}
												rightSection={
													<ActionIcon
														size={32}
														bg="violet.5"
														variant="filled"
														mr={10}
														onClick={toggleDiscountMode}
													>
														<IconNumber123 size={16} />
													</ActionIcon>
												}
											/>
										)}
									</FormValidationWrapper>
								)}
							</Grid.Col>
							<Grid.Col span={6} bg="green">
								<FormValidationWrapper
									errorMessage={t("ReceiveAmountValidateMessage")}
									opened={!!salesForm.errors.paymentAmount}
								>
									<NumberInput
										allowNegative={false}
										hideControls
										decimalScale={3}
										placeholder={
											isSplitPaymentActive ? t("SplitPaymentActive") : t("Amount")
										}
										size="sm"
										min={0}
										readOnly={isSplitPaymentActive}
										disabled={isSplitPaymentActive}
										leftSection={<IconPlusMinus size={16} opacity={0.5} />}
										{...salesForm.getInputProps("paymentAmount", { type: "number" })}
									/>
								</FormValidationWrapper>
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
					bg="var(--theme-hold-btn-color)"
					color="white"
					radius={0}
					form="salesForm"
					type="submit"
					loading={isAddingSales}
				>
					{t("Hold")}
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

			{/* =============== customer drawer for selecting/adding customer =============== */}
			<CustomerDrawer
				opened={customerDrawerOpened}
				onClose={customerDrawerClose}
				form={salesForm}
				customersDropdownData={customersDropdownData}
				onCustomerSelect={handleCustomerSelect}
			/>
		</>
	);
}
