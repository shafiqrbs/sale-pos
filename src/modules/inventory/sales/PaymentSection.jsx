import React, { useEffect, useMemo, useState } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Grid,
	Group,
	Image,
	NumberInput, ScrollArea,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { Carousel } from "@mantine/carousel";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import {
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
import SalesCustomerDrawer from "@components/drawers/SalesCustomerDrawer";
import { DateInput } from "@mantine/dates";

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

	const dropdownOptions = customersDropdownData.map((customer) => ({
		label: `${customer.mobile || ''} -- ${customer.name || ''}`,
		value: customer.id?.toString(),
	}));

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
		setDiscountMode("discount");
		setPercentageValue(0);
	}, [ resetKey ]);

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

	useHotkeys([ [ "alt+s", () => document.getElementById("SalesFormSubmit")?.click() ] ])

	return (
		<>
			<Box p={'xs'} bg={'gray.4'}>
				<Grid columns={24} gutter={8} mt="xs">
					<Grid.Col span={12}>
						<Grid columns={18} gutter={4} justify="center" align="center" p={'xs'} bg="gray.1">
							<Grid.Col span={5}>
								<FormValidationWrapper
									errorMessage={t("ClickRightButtonForPercentFlat")}
									opened={!!salesForm.errors.coupon_code}
								>
									<Button
										fullWidth
										onClick={handleDiscountModeChange}
										variant="light"
										bg={'orange.1'}
										px="md"
										fz="md"
										size={'xl'}
										leftSection={
											discountMode === "coupon" ? (
												<IconTicket size={14} />
											) : (
												<IconPercentage size={14} />
											)
										}
										color="orange"
									>
										{discountMode === "coupon" ? t("Coupon") : t("Discount")}
									</Button>
								</FormValidationWrapper>
							</Grid.Col>
							<Grid.Col
								span={4}
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
										size={'xl'}
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
												size={'xl'}
												onChange={(value) => salesForm.setFieldValue("discount", value)}
												rightSection={
													<ActionIcon
														size={32}
														bg="red.5"
														variant="filled"
														mr={10}
														onClick={toggleDiscountMode}
													>
														<IconNumber123 size={16} />
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
												max={99}
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
														<IconPercentage size={16} />
													</ActionIcon>
												}
											/>
										)}
									</FormValidationWrapper>
								)}
							</Grid.Col>
							<Grid.Col span={9} px={4} pb={'10'}>
								<Grid columns={18} bg="gray.1" p={'xs'}>
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
												{formatCurrency(calculateVATAmount(itemsTotal, configData?.inventory_config?.config_vat))}
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
									<Grid.Col span={6}>
										<Stack gap={0} align="center" justify="center"  bg="gray.4" bdrs={4}>
											<Text fw={800} c="black" size="lg">
												{currencySymbol} {formatCurrency(itemsTotal)}
											</Text>
											<Text fw={500} c="gray" size="xs">
												Sub-Total
											</Text>
										</Stack>
									</Grid.Col>
								</Grid>
							</Grid.Col>
							<Grid.Col span={9}>
								<Textarea
									value={salesNarration}
									onChange={(event) =>
										salesForm.setFieldValue(
											"salesNarration",
											event.currentTarget.value
										)
									}
									placeholder="Narration"
									size="lg"
									minRows={8}
								/>
							</Grid.Col>
							<Grid.Col span={9}>
								<Box>
									<FormValidationWrapper
										errorMessage={t("ChooseCustomer")}
										opened={!!salesForm.errors.customer_id}
									>
										<Select
											placeholder={t('ChooseCustomer')}
											data={dropdownOptions}
											searchable
											clearable
											value={salesForm.values.customer_id}
											onChange={(value) => salesForm.setFieldValue("customer_id", value ?? "")}
											size="sm"
											nothingFoundMessage={t('NoCustomerFound')}
											rightSectionPointerEvents="pointer-events"
											rightSection={
												<ActionIcon
													variant="filled"
													onClick={handleCustomerAdd}
												>
													<IconUserPlus size={16} />
												</ActionIcon>
											}
										/>
									</FormValidationWrapper>
									<DateInput
										my='4'
										value={salesForm.values.salesDate}
										onChange={(value) => salesForm.setFieldValue("salesDate", value)}
										valueFormat="MMMM D, YYYY"
										size="xs"
										label={null}
										placeholder="Select date"
									/>
								</Box>
							</Grid.Col>
						</Grid>
					</Grid.Col>
					<Grid.Col span={12}>
						<Grid columns={24} gutter={2} bg="gray.1">

							<Grid.Col span={12}>
								<Stack
									p={'xs'}
									bg={'white'}
									className="borderRadiusAll"
									h="100%"
									justify="space-between"
									gap={0}
								>

									<Grid columns={24} gutter={{ base: 8 }} pr="2px" align="center" bg="blue.8" justify="center">

										<Grid.Col span={16}>
											<Stack gap={0} align="center" justify="center"  py={'xs'} bdrs={4}>
												<Text fw={800} c="white" size="lg">
													{currencySymbol} {formatCurrency(grandTotal)}
												</Text>
												<Text fw={500} c="white" size="md">
													Grand Total
												</Text>
											</Stack>

										</Grid.Col>
										<Grid.Col span={8} >
											<Stack gap={0} align="center" justify="center" bg="blue.1" py={'xs'} mr={'2'} bdrs={4}>
												<Text fw={800} c="blue" size="lg">
													{currencySymbol} {formatCurrency(dueAmount)}
												</Text>
												<Text fw={500} c="blue" size="xs">
													Still Due
												</Text>
											</Stack>
										</Grid.Col>
									</Grid>
									{/*<Grid columns={24} gutter={{ base: 8 }} pr="2px" align="center" justify="center">
								<Grid.Col span={8}>
									<FormValidationWrapper
										errorMessage={t("ClickRightButtonForPercentFlat")}
										opened={!!salesForm.errors.coupon_code}
									>
										<Button
											fullWidth
											onClick={handleDiscountModeChange}
											variant="filled"
											px="md"
											fz="xl"
											size={'xl'}
											leftSection={
												discountMode === "coupon" ? (
													<IconTicket size={14} />
												) : (
													<IconPercentage size={14} />
												)
											}
											color="orange"
										>
											{discountMode === "coupon" ? t("Coupon") : t("Discount")}
										</Button>
									</FormValidationWrapper>
								</Grid.Col>
								<Grid.Col
									span={8}
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
											size={'xl'}
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
													size={'xl'}
													onChange={(value) => salesForm.setFieldValue("discount", value)}
													rightSection={
														<ActionIcon
															size={32}
															bg="red.5"
															variant="filled"
															mr={10}
															onClick={toggleDiscountMode}
														>
															<IconNumber123 size={16} />
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
															<IconPercentage size={16} />
														</ActionIcon>
													}
												/>
											)}
										</FormValidationWrapper>
									)}
								</Grid.Col>
								<Grid.Col span={8}>
									<Stack gap={0} align="center" justify="center" bg="red" py={'xs'} bdrs={4}>
										<Text fw={800} c="white" size="lg">
											{currencySymbol} {formatCurrency(dueAmount)}
										</Text>
										<Text fw={500} c="white" size="md">
											Due
										</Text>
									</Stack>
								</Grid.Col>
							</Grid>*/}
									<Grid columns={24} gutter={{ base: 8 }}  pr="2px" align="center" justify="center">
										<Grid.Col span={6} ta={'center'}>
											<Text c="blue" fz={'md'} fw={'600'}>Cash</Text>
										</Grid.Col>
										<Grid.Col span={10} bg="blue.1">
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
													size={'lg'}
													min={0}
													readOnly={isSplitPaymentActive}
													disabled={isSplitPaymentActive}
													leftSection={<IconPlusMinus size={16} opacity={0.5} />}
													{...salesForm.getInputProps("paymentAmount", { type: "number" })}
												/>
											</FormValidationWrapper>
										</Grid.Col>
										<Grid.Col span={8} >
											<Stack gap={0} align="center" justify="center"  py={'1'} bdrs={4}>
												<Tooltip
													label="Split payment"
													px={16}
													py={2}
													c="white"
													bg={'green'}
													withArrow
													zIndex={999}
													transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
												>
													<ActionIcon
														size="xl"
														color={isSplitPaymentActive ? "green" : "blue"}
														variant="transparent"
														onClick={handleOpenSplitPaymentDrawer}
														disabled={!salesForm.values.paymentAmount}
													>
														<IconScissors style={{ width: "70%", height: "70%" }} stroke={1.5} />
													</ActionIcon>
												</Tooltip>
												<Text fz={'xs'} c={'gray.6'}>Multiple Payment</Text>
											</Stack>
										</Grid.Col>
									</Grid>
								</Stack>
							</Grid.Col>
							<Grid.Col span={6}>
								<Stack
									h="100%"
									justify="space-between"
									gap={0}
								>
									<ScrollArea h={174} scrollbarSize={2}>
										{transactionMode?.map((mode) => (
											<Box
												onClick={() => handleSelectTransactionMode(mode.id, mode.name)}
												pos="relative"
												style={{
													border:
														payments.length === 1 &&
														payments[0]?.transaction_mode_id === mode.id
															? "2px solid #228be6"
															: "2px solid #dddddd",
													marginBottom: 4,
												}}
												className={
													isSplitPaymentActive ? "cursor-not-allowed" : "cursor-pointer"
												}
											>
												<Flex
													bg={'white'}
													direction="column"
													align="center"
													justify="center"
													c="black"
												>
													<Tooltip
														label={mode.name}
														withArrow
														px={8}
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
										))}
									</ScrollArea>
								</Stack>
							</Grid.Col>
							<Grid.Col span={6}>
								<Stack
									p={'xs'}
									className="borderRadiusAll"
									h="100%"
									justify="space-between"
									gap={0}
								>
									<Button
										fullWidth
										variant="outline" color="red"
										radius={0}
										size="lg"
										form="salesForm"
										type="submit"
										id="SalesHoldFormSubmit"
										loading={isAddingSales}
									>
										{t("Hold")}
									</Button>

									<Button
										fullWidth
										variant="outline" color="blue"
										radius={0}
										size="lg"
										form="salesForm"
										type="submit"
										id="SalesFormSubmit"
										loading={isAddingSales}
									>
										Save
									</Button>
									<Button
										fullWidth
										bg="var(--theme-pos-btn-color)"
										color="white"
										radius={0}
										size="lg"
										type="button"
										leftSection={<IconPrinter size={16} />}
										onClick={onPosPrint}
										loading={isAddingSales}
									>
										POS
									</Button>

								</Stack>

							</Grid.Col>
						</Grid>
					</Grid.Col>
				</Grid>
			</Box>
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
			<SalesCustomerDrawer
				opened={customerDrawerOpened}
				onClose={customerDrawerClose}
				form={salesForm}
				customersDropdownData={customersDropdownData}
			/>
		</>
	);
}
