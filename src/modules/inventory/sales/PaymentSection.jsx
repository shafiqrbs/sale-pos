import { useEffect, useMemo, useState } from "react";
import {
	ActionIcon,
	Box,
	Button,
	Flex,
	Grid,
	Group,
	NumberInput,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import {
	IconCashPlus,
	IconCheck,
	IconEyeDollar,
	IconNumber123,
	IconPercentage,
	IconPlayerPause,
	IconPlusMinus,
	IconPrinter,
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
	itemsForm,
	itemsTotal,
	isAddingItem,
	onPosPrint,
	resetKey = 0,
	isEditMode = false,
}) {
	const { t } = useTranslation();
	const { transactionMode } = useTransactionMode();
	const { configData, currencySymbol } = useConfigData();

	const [ customersDropdownData, setCustomersDropdownData ] = useState([]);
	const [ discountMode, setDiscountMode ] = useState("discount");
	const [ percentageValue, setPercentageValue ] = useState(0);
	const [ customerDrawerOpened, { open: customerDrawerOpen, close: customerDrawerClose } ] =
		useDisclosure(false);

	const { discount_type, discount, coupon_code, salesNarration, paymentAmount } = itemsForm.values;

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

	const payments = itemsForm.values.payments ?? [];
	const splitPaymentDrawerOpened = itemsForm.values.splitPaymentDrawerOpened ?? false;
	const isSplitPaymentActive = payments.length > 1;

	// =============== set default payment mode (cash) once transaction modes are loaded ===============
	useEffect(() => {
		if (transactionMode?.length > 0 && payments.length === 0) {
			const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
			const defaultMethod = cashMethod || transactionMode[ 0 ];
			itemsForm.setFieldValue("payments", [
				{
					transaction_mode_id: defaultMethod.id,
					transaction_mode_name: defaultMethod.name,
					amount: grandTotal,
					remark: "",
				},
			]);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ transactionMode ]);

	// =============== auto-sync paymentAmount and single payment amount with grandTotal;
	// skipped in edit mode because paymentAmount is pre-populated from the stored sale
	// and overwriting it on every grandTotal change would reset the stored value to 0
	// on the initial render before editItems are loaded ===============
	useEffect(() => {
		if (isEditMode) return;

		if (!isSplitPaymentActive) {
			itemsForm.setFieldValue("paymentAmount", grandTotal);
			if (payments.length === 1) {
				itemsForm.setFieldValue("payments.0.amount", grandTotal);
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
		label: `${customer.mobile || ""} -- ${customer.name || ""}`,
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
		itemsForm.setFieldValue("discount", Math.round(discountAmount));
	};

	const handleDiscountModeChange = () => {
		if (discountMode === "coupon") {
			setDiscountMode("discount");
			itemsForm.setFieldValue("discount_type", "flat");
			itemsForm.setFieldValue("coupon_code", "");
		} else {
			setDiscountMode("coupon");
			itemsForm.setFieldValue("discount_type", "coupon");
			itemsForm.setFieldValue("discount", 0);
		}
	};

	const toggleDiscountMode = () => {
		itemsForm.setFieldValue("discount", 0);
		setPercentageValue(0);
		const newType = discount_type === "flat" ? "percentage" : "flat";
		itemsForm.setFieldValue("discount_type", newType);
	};

	const handleOpenSplitPaymentDrawer = () => {
		itemsForm.setFieldValue("splitPaymentDrawerOpened", true);
	};

	const handleSaveSplitPayments = (splitPayments) => {
		const totalSplitAmount = splitPayments.reduce((sum, payment) => sum + payment.amount, 0);
		itemsForm.setFieldValue("payments", splitPayments);
		itemsForm.setFieldValue("paymentAmount", totalSplitAmount);
	};

	const clearSplitPayment = () => {
		const cashMethod = transactionMode?.find((mode) => mode.slug === "cash");
		const defaultMethod = cashMethod || transactionMode?.[ 0 ];
		itemsForm.setFieldValue("payments", [
			{
				transaction_mode_id: defaultMethod?.id,
				transaction_mode_name: defaultMethod?.name,
				amount: grandTotal,
				remark: "",
			},
		]);
		itemsForm.setFieldValue("paymentAmount", grandTotal);
	};

	useHotkeys([ [ "alt+s", () => document.getElementById("ItemsFormSubmit")?.click() ] ]);

	return (
		<>
			<Box p={"xs"} bg={"gray.4"}>
				<Grid columns={24} gutter={8} mt="xs">
					<Grid.Col span={12}>
						<Grid columns={18} gutter={4} justify="center" align="center" p={"xs"} bg="gray.1">
							<Grid.Col span={9} px={4}>
								<Box bg={"gray.2"} p={"4"} pt={"4"} pr={"4"}>
									<FormValidationWrapper
										errorMessage={t("ChooseCustomer")}
										opened={!!itemsForm.errors.customer_id}
									>
										<Select
											placeholder={t("ChooseCustomer")}
											data={dropdownOptions}
											searchable
											clearable
											value={itemsForm.values.customer_id}
											onChange={(value) => itemsForm.setFieldValue("customer_id", value ?? "")}
											size="sm"
											nothingFoundMessage={t("NoCustomerFound")}
											rightSectionPointerEvents="pointer-events"
											rightSection={
												<ActionIcon variant="filled" onClick={handleCustomerAdd}>
													<IconUserPlus size={16} />
												</ActionIcon>
											}
										/>
									</FormValidationWrapper>
									<DateInput
										my="4"
										value={itemsForm.values.salesDate}
										onChange={(value) => itemsForm.setFieldValue("salesDate", value)}
										valueFormat="MMMM D, YYYY"
										size="xs"
										label={null}
										placeholder="Select date"
									/>
									<Textarea
										value={salesNarration}
										onChange={(event) =>
											itemsForm.setFieldValue("salesNarration", event.currentTarget.value)
										}
										placeholder="Narration"
										size="md"
										minRows={6}
									/>
								</Box>
							</Grid.Col>
							<Grid.Col span={9} px={4} pb={"xs"} bg={"white"}>
								<Grid columns={18} p={"xs"}>
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
												VAT {configData?.inventory_config?.config_vat?.vat_percent} %
											</Text>
											<Text fz="sm" fw={800} c="black">
												{configData?.inventory_config?.config_vat &&
													formatCurrency(
														calculateVATAmount(itemsTotal, configData?.inventory_config?.config_vat)
													)}
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
										<Stack gap={0} align="center" justify="center" p={"4"} bg="gray.4" bdrs={4}>
											<Text fw={800} c="black" size="lg">
												{currencySymbol} {formatCurrency(itemsTotal)}
											</Text>
											<Text fw={500} c="gray" size="xs">
												Sub-Total
											</Text>
										</Stack>
									</Grid.Col>
									<Grid.Col span={18} bg={"#fffbeb85"}>
										<Flex
											direction={{ base: "column", sm: "row" }}
											gap={{ base: "sm", sm: "lg" }}
											justify={{ sm: "center" }}
										>
											<Box w={"50%"}>
												<FormValidationWrapper
													errorMessage={t("ClickRightButtonForPercentFlat")}
													opened={!!itemsForm.errors.coupon_code}
												>
													<Tooltip
														label="Click here for change mode"
														c="white"
														bg={"yellow"}
														withArrow
														zIndex={999}
														transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
													>
														<Button
															fullWidth
															onClick={handleDiscountModeChange}
															variant="outline"
															bg={"#fffbeb85"}
															px="md"
															fz="md"
															size={"md"}
															leftSection={
																discountMode === "coupon" ? (
																	<IconTicket size={14} />
																) : (
																	<IconPercentage size={14} />
																)
															}
															color="#b45309"
														>
															{discountMode === "coupon" ? t("Coupon") : t("Discount")}
														</Button>
													</Tooltip>
												</FormValidationWrapper>
											</Box>
											<Box w={"50%"} mt={"4"}>
												{discountMode === "coupon" ? (
													<TextInput
														type="text"
														placeholder={t("CouponCode")}
														value={coupon_code}
														error={itemsForm.errors.coupon_code}
														size="sm"
														onChange={(event) => {
															itemsForm.setFieldValue("coupon_code", event.target.value);
														}}
														rightSection={
															<FormValidationWrapper
																errorMessage={t("CouponCode")}
																opened={!!itemsForm.errors.coupon_code}
																position="left"
															>
																<IconTicket size={16} opacity={0.5} />
															</FormValidationWrapper>
														}
													/>
												) : (
													<FormValidationWrapper
														errorMessage={t("ClickRightButtonForPercentFlat")}
														opened={!!itemsForm.errors.discount}
														position="left"
													>
														{discount_type === "flat" ? (
															<NumberInput
																placeholder={t("Discount")}
																value={discount}
																error={itemsForm.errors.discount}
																size="sm"
																onChange={(value) => itemsForm.setFieldValue("discount", value)}
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
																error={itemsForm.errors.discount}
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
											</Box>
										</Flex>
									</Grid.Col>
								</Grid>
							</Grid.Col>
						</Grid>
					</Grid.Col>
					<Grid.Col span={12}>
						<Grid columns={24} gutter={2} bg="white">
							<Grid.Col span={16}>
								<Stack
									p={"xs"}
									bg={"white"}
									className="borderRadiusAll"
									h="100%"
									justify="space-between"
									gap={0}
								>
									<Grid
										columns={24}
										gutter={{ base: 8 }}
										pr="2px"
										align="center"
										bg="#1e40af"
										justify="center"
									>
										<Grid.Col span={16}>
											<Stack gap={0} align="center" justify="center" py={"xs"} bdrs={4}>
												<Text fw={800} c="white" size="xl">
													{currencySymbol} {formatCurrency(grandTotal)}
												</Text>
												<Text fw={500} c="white" size="md">
													Grand Total
												</Text>
											</Stack>
										</Grid.Col>
										<Grid.Col span={8}>
											<Stack
												gap={0}
												align="center"
												justify="center"
												bg="white"
												py={"xs"}
												mr={"3"}
												bdrs={4}
											>
												<Text fw={800} c="#1e40af" size="lg">
													{currencySymbol} {formatCurrency(dueAmount)}
												</Text>
												<Text fw={500} c="#1e40af" size="xs">
													Still Due
												</Text>
											</Stack>
										</Grid.Col>
									</Grid>
									{/*<Grid columns={24} gutter={{ base: 8 }} pr="2px" align="center" justify="center">
								<Grid.Col span={8}>
									<FormValidationWrapper
										errorMessage={t("ClickRightButtonForPercentFlat")}
										opened={!!itemsForm.errors.coupon_code}
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
											error={itemsForm.errors.coupon_code}
											size={'xl'}
											onChange={(event) => {
												itemsForm.setFieldValue("coupon_code", event.target.value);
											}}
											rightSection={
												<FormValidationWrapper
													errorMessage={t("CouponCode")}
													opened={!!itemsForm.errors.coupon_code}
													position="left"
												>
													<IconTicket size={16} opacity={0.5} />
												</FormValidationWrapper>
											}
										/>
									) : (
										<FormValidationWrapper
											errorMessage={t("ClickRightButtonForPercentFlat")}
											opened={!!itemsForm.errors.discount}
											position="left"
										>
											{discount_type === "flat" ? (
												<NumberInput
													placeholder={t("Discount")}
													value={discount}
													error={itemsForm.errors.discount}
													size={'xl'}
													onChange={(value) => itemsForm.setFieldValue("discount", value)}
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
													error={itemsForm.errors.discount}
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
									<Grid
										columns={24}
										gutter={{ base: 8 }}
										bg={"#405bb112"}
										pr="2px"
										align="center"
										justify="center"
									>
										<Grid.Col span={8}>
											<Stack gap={0} align="center" justify="center" py={"3"} bdrs={4}>
												<Tooltip
													label="Digital Payment"
													c="white"
													bg="red"
													withArrow
													zIndex={999}
													transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
												>
													<ActionIcon
														size="xl"
														color={isSplitPaymentActive ? "green" : "red"}
														variant="transparent"
														onClick={handleOpenSplitPaymentDrawer}
													>
														<IconCashPlus style={{ width: "70%", height: "70%" }} stroke={1.5} />
													</ActionIcon>
												</Tooltip>
												<Text fz={"xs"} fw={"600"} c="red">
													Digital Payment
												</Text>
											</Stack>
										</Grid.Col>
										<Grid.Col span={8} ta={"center"}>
											<Text c="#1e40af" fz={"md"} fw={"600"}>
												Cash
											</Text>
										</Grid.Col>
										<Grid.Col span={8} bg="#405bb112">
											<FormValidationWrapper
												errorMessage={t("ReceiveAmountValidateMessage")}
												opened={!!itemsForm.errors.paymentAmount}
											>
												<NumberInput
													allowNegative={false}
													hideControls
													decimalScale={3}
													thousandSeparator=","
													placeholder={isSplitPaymentActive ? t("SplitPaymentActive") : t("Amount")}
													size={"lg"}
													min={0}
													readOnly={isSplitPaymentActive}
													leftSection={<IconPlusMinus size={16} opacity={0.5} />}
													rightSection={
														<Tooltip
															label="Profit"
															c="white"
															bg="red"
															withArrow
															zIndex={999}
															transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
														>
															<IconEyeDollar size={16} opacity={0.5} />
														</Tooltip>
													}
													{...itemsForm.getInputProps("paymentAmount", { type: "number" })}
												/>
											</FormValidationWrapper>
										</Grid.Col>
									</Grid>
								</Stack>
							</Grid.Col>
							{/*<Grid.Col span={6}>
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
							</Grid.Col>*/}
							<Grid.Col span={8}>
								<Stack
									p={"xs"}
									bg={"gray.1"}
									className="borderRadiusAll"
									h="100%"
									justify="space-between"
									gap={0}
								>
									<Button.Group>
										<Button
											fullWidth
											color="green"
											radius={0}
											size="xs"
											form="itemsForm"
											type="submit"
											id="ItemsFormSubmit"
											leftSection={<IconCheck size={16} />}
											disabled={isAddingItem}
										>
											{isEditMode ? "Update" : "Save"}
										</Button>
										<Button
											fullWidth
											variant="light"
											color="red"
											radius={0}
											size="xs"
											form="itemsForm"
											type="submit"
											id="ItemsHoldFormSubmit"
											leftSection={<IconPlayerPause size={16} />}
											disabled={isAddingItem}
										>
											{t("Hold")}
										</Button>
									</Button.Group>

									<Button
										fullWidth
										variant="light"
										bg="white"
										color="gray"
										radius={0}
										size="lg"
										form="itemsForm"
										type="submit"
										id="ItemsFormSubmit"
										disabled={isAddingItem}
										leftSection={<IconPrinter size={16} />}
									>
										Print
									</Button>

									<Button
										fullWidth
										bg="var(--theme-pos-btn-color)"
										color="white"
										radius={0}
										size="lg"
										type="button"
										onClick={onPosPrint}
										disabled={isAddingItem}
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
				onClose={() => itemsForm.setFieldValue("splitPaymentDrawerOpened", false)}
				totalAmount={grandTotal}
				onSave={handleSaveSplitPayments}
				onRemove={clearSplitPayment}
				existingSplitPayments={payments}
			/>

			{/* =============== customer drawer for selecting/adding customer =============== */}
			<SalesCustomerDrawer
				opened={customerDrawerOpened}
				onClose={customerDrawerClose}
				form={itemsForm}
				customersDropdownData={customersDropdownData}
			/>
		</>
	);
}
