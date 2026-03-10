import { useEffect, useState, useMemo, useRef } from "react";
import {
	Stack,
	Text,
	Group,
	NumberInput,
	Button,
	Box,
	Image,
	Flex,
	Divider,
	ScrollArea,
	TextInput,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import { useOutletContext } from "react-router";
import GlobalDrawer from "../drawers/GlobalDrawer";
import { formatCurrency } from "@utils/index";

export default function SplitPaymentsDrawer({
	opened,
	onClose,
	totalAmount,
	onSave,
	onRemove,
	existingSplitPayments = [],
}) {
	const { t } = useTranslation();
	const { isOnline, mainAreaHeight } = useOutletContext();
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	const [methods, setMethods] = useState([]);

	const initialPayments = useMemo(() => {
		const payments = {};
		if (existingSplitPayments.length > 0) {
			existingSplitPayments.forEach((payment) => {
				payments[payment.transaction_mode_id] = {
					amount: payment.amount,
					remark: payment.remark || "",
				};
			});
		}
		return payments;
	}, [existingSplitPayments]);

	const [paymentInputs, setPaymentInputs] = useState(initialPayments);
	const amountInputRefsMap = useRef({});
	const remarkInputRefsMap = useRef({});

	const currencySymbol =
		configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol;

	useEffect(() => {
		async function fetchMethods() {
			const data = await window.dbAPI.getDataFromTable("accounting_transaction_mode");
			setMethods(data);
		}
		fetchMethods();
	}, []);

	useEffect(() => {
		setPaymentInputs(initialPayments);
	}, [initialPayments]);

	const totalEnteredAmount = Object.values(paymentInputs).reduce((sum, value) => {
		const amount = typeof value === "object" ? value?.amount : value;
		return sum + (parseFloat(amount) || 0);
	}, 0);

	const dueAmount = totalAmount - totalEnteredAmount;
	const isSaveDisabled = totalEnteredAmount !== totalAmount;

	const handleInputChange = (methodId, type, value) => {
		setPaymentInputs((prevInputs) => ({
			...prevInputs,
			[methodId]: {
				...prevInputs[methodId],
				[type]: value,
			},
		}));
	};

	const handleSaveClick = () => {
		const splitPayments = methods
			.filter((method) => {
				const amount = paymentInputs[method.id]?.amount ?? paymentInputs[method.id];
				return amount && parseFloat(amount) > 0;
			})
			.map((method) => ({
				transaction_mode_id: method.id,
				transaction_mode_name: method.name,
				amount: parseFloat(paymentInputs[method.id]?.amount ?? paymentInputs[method.id]),
				remark: paymentInputs[method.id]?.remark || "",
			}));

		onSave(splitPayments);
		onClose();
	};

	const handleRemoveClick = () => {
		onRemove();
		onClose();
	};

	const handleAmountKeyDown = (methodId) => (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			remarkInputRefsMap.current[methodId]?.focus();
		}
	};

	const handleRemarkKeyDown = (isLastMethod, nextMethod) => (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			event.stopPropagation();
			if (isLastMethod) {
				if (!isSaveDisabled) handleSaveClick();
			} else {
				amountInputRefsMap.current[nextMethod.id]?.focus();
			}
		}
	};

	const getAmountRefCallback = (methodId) => (element) => {
		if (element) {
			const input = element.querySelector?.("input") ?? element;
			amountInputRefsMap.current[methodId] = input;
		}
	};

	const getRemarkRefCallback = (methodId) => (element) => {
		if (element) {
			const input = element.querySelector?.("input") ?? element;
			remarkInputRefsMap.current[methodId] = input;
		}
	};

	return (
		<GlobalDrawer
			opened={opened}
			onClose={onClose}
			title={t("Digital & Multi Payments")}
			position="right"
			size="lg"
		>
			<Box>
				<Stack gap="md">
					<Divider />
					<Box>
						<Group justify="space-between" mb="xs">
							<Text size="lg" fw={600}>
								{t("Total")}
							</Text>
							<Text size="lg" fw={700} c="var(--theme-primary-color-6)">
								{configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol}{" "}
								{formatCurrency(totalAmount)}
							</Text>
						</Group>
						<Group justify="space-between">
							<Text size="md" fw={500}>
								{t("Due")}
							</Text>
							<Text size="md" fw={600} c={dueAmount > 0 ? "red" : "green"}>
								{configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol}{" "}
								{formatCurrency(dueAmount)}
							</Text>
						</Group>
					</Box>

					<Divider />
					<ScrollArea
						scrollbars="y"
						scrollHideDelay={100}
						scrollbarSize={4}
						h={mainAreaHeight - 164}
					>
						{/* =============== payment methods section ================ */}
						<Stack gap="sm">
							{methods?.map((method, methodIndex) => {
								const isLastMethod = methodIndex === methods.length - 1;
								const nextMethod = !isLastMethod ? methods[methodIndex + 1] : null;

								return (
									<Flex key={method.id} justify="space-between" align="center" gap="md">
										<Flex align="center" gap="md">
											<Image
												w={80}
												fit="contain"
												alt={method.name}
												src={method.path}
												border="1px solid #2f9e44"
												radius="sm"
												fallbackSrc={`https://placehold.co/80x50/FFFFFF/2f9e44?text=${method.name}`}
											/>
											<Text size="sm" fw={500} style={{ minWidth: "100px" }}>
												{method.name}
											</Text>
										</Flex>
										<Flex align="center" gap="md">
											<NumberInput
												ref={getAmountRefCallback(method.id)}
												w={120}
												name="amount"
												placeholder={t("Amount")}
												value={paymentInputs[method.id]?.amount ?? paymentInputs[method.id] ?? ""}
												onChange={(value) => handleInputChange(method.id, "amount", value)}
												onKeyDown={handleAmountKeyDown(method.id)}
												allowNegative={false}
												decimalScale={2}
												hideControls
												size="sm"
												style={{ flex: 1 }}
												min={0}
												prefix={currencySymbol}
												thousandSeparator=","
											/>
											<TextInput
												ref={getRemarkRefCallback(method.id)}
												name="remark"
												value={paymentInputs[method.id]?.remark || ""}
												onChange={(event) =>
													handleInputChange(method.id, "remark", event.target.value)
												}
												onKeyDown={handleRemarkKeyDown(isLastMethod, nextMethod)}
												placeholder={t("Transaction/Mobile/Remark")}
												size="sm"
											/>
										</Flex>
									</Flex>
								);
							})}
						</Stack>
					</ScrollArea>
				</Stack>

				<Divider />
				{/* =============== action buttons ================ */}
				<Group justify="space-between" mt="md">
					<Button variant="outline" onClick={onClose}>
						{t("Close")}
					</Button>
					<Group>
						{existingSplitPayments.length > 0 && (
							<Button onClick={handleRemoveClick} color="red" variant="outline">
								{t("CancelSplit")}
							</Button>
						)}
						<Button onClick={handleSaveClick} disabled={isSaveDisabled} color="green">
							{t("Save")}
						</Button>
					</Group>
				</Group>
			</Box>
		</GlobalDrawer>
	);
}
