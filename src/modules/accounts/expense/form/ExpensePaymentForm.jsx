import { useEffect, useMemo, useState } from "react";
import {
	Box,
	Button,
	Flex,
	Grid,
	Group,
	Image,
	LoadingOverlay,
	Select,
	Text,
	Textarea,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useTranslation } from "react-i18next";
import { IconCheck, IconDeviceFloppy, IconPercentage } from "@tabler/icons-react";
import InputForm from "@components/form-builders/InputForm";
import SwitchForm from "@components/form-builders/SwitchForm";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import useTransactionMode from "@hooks/useTransactionMode";
import { showNotification } from "@components/ShowNotificationComponent";

const EXPENSE_TYPE_VALUES = [ "Rent", "Utilities", "Salary", "Miscellaneous" ];

export default function ExpensePaymentForm() {
	const { t } = useTranslation();
	const { transactionMode } = useTransactionMode();
	const [ isSubmitting, setIsSubmitting ] = useState(false);

	const form = useForm({
		initialValues: {
			expense_type: "",
			transactionModeId: "",
			transactionMode: "",
			amount: "",
			Narration: "",
			is_sms: true,
			is_approve: true,
		},
		validate: {
			expense_type: (value) => (!value ? t("ExpenseTypeRequired") : null),
			transactionModeId: (value) => (!value ? t("TransactionModeRequired") : null),
		},
	});

	const expenseTypeOptions = useMemo(
		() =>
			EXPENSE_TYPE_VALUES.map((value) => ({
				value,
				label: t(`ExpenseType${value}`),
			})),
		[ t ]
	);

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

	useEffect(() => {
		if (!transactionMode?.length) return;
		if (form.values.transactionModeId) return;

		const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
		if (cashMethod) {
			form.setFieldValue("transactionModeId", String(cashMethod.id));
			form.setFieldValue("transactionMode", cashMethod.name);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only seed defaults when modes load
	}, [ transactionMode ]);

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

	const handleSubmit = form.onSubmit(async () => {
		setIsSubmitting(true);
		try {
			showNotification(t("AccountsPaymentSaveNotConfigured"), "blue");
		} finally {
			setIsSubmitting(false);
		}
	});

	const narration = form.values.Narration;

	return (
		<Box component="form" onSubmit={handleSubmit}>
			<Box bg="white" pos="relative">
				<LoadingOverlay
					visible={isSubmitting}
					zIndex={1000}
					overlayProps={{ radius: "sm", blur: 2 }}
					loaderProps={{ color: "red.6" }}
				/>
				<Box px="xs" className="border-radius-all">
					<Box>
						<Grid gutter={{ base: 6 }}>
							<Grid.Col span={3}>
								<Text fz="sm" fw={600} mt={6}>
									{t("ExpenseType")}
								</Text>
							</Grid.Col>
							<Grid.Col span={9}>
								<FormValidationWrapper
									errorMessage={t("ExpenseTypeRequired")}
									opened={!!form.errors.expense_type}
								>
									<Select
										placeholder={t("SelectExpenseType")}
										data={expenseTypeOptions}
										searchable
										clearable
										value={form.values.expense_type}
										onChange={(value) => form.setFieldValue("expense_type", value ?? "")}
										size="sm"
										nothingFoundMessage={t("NoExpenseTypeFound")}
									/>
								</FormValidationWrapper>
							</Grid.Col>
						</Grid>
					</Box>
					<Box>
						<Grid gutter={{ base: 6 }}>
							<Grid.Col span={3}>
								<Text fz="sm" fw={600} mt={6}>
									{t("Outstanding")}
								</Text>
							</Grid.Col>
							<Grid.Col span={9}>
								<Text pt="4" fz="18" c="red" fw={600}>
									0
								</Text>
							</Grid.Col>
						</Grid>
					</Box>
					<Box mt="xs">
						<Grid gutter={6}>
							<Grid.Col span={3}>
								<Text fz="sm" fw={600} mt={6}>
									{t("PaymentMode")}
								</Text>
							</Grid.Col>
							<Grid.Col span={5}>
								<Box bg="white" h="100%">
									<FormValidationWrapper
										errorMessage={t("TransactionModeRequired")}
										opened={!!form.errors.transactionModeId}
									>
										<Select
											data={groupedTransactionMode}
											renderOption={renderTransactionModeOption}
											searchable
											{...form.getInputProps("transactionModeId", { type: "search" })}
											onChange={(value, option) => {
												form.setFieldValue("transactionMode", option.label);
												form.setFieldValue("transactionModeId", String(value));
											}}
											nothingFoundMessage={t("NoTransactionModeFound")}
											placeholder={t("SelectTransactionMode")}
											size="sm"
										/>
									</FormValidationWrapper>
								</Box>
							</Grid.Col>
							<Grid.Col span={4} bg="var(--theme-primary-color-6)">
								<InputForm
									type="number"
									leftSection={<IconPercentage size={16} opacity={0.5} />}
									tooltip={t("ReceiveAmountValidateMessage")}
									placeholder={t("PaymentAmount")}
									required={false}
									nextField="ExpensePaymentFormSubmit"
									name="amount"
									form={form}
									id="amount"
								/>
							</Grid.Col>
						</Grid>
					</Box>
					<Box mt="xs">
						<Grid gutter={6}>
							<Grid.Col span={3}>
								<Text fz="sm" fw={600} mt={6}>
									{t("Narration")}
								</Text>
							</Grid.Col>
							<Grid.Col span={9}>
								<Textarea
									value={narration}
									onChange={(event) =>
										form.setFieldValue("Narration", event.currentTarget.value)
									}
									placeholder={t("Narration")}
									size="xs"
									minRows={2}
								/>
							</Grid.Col>
						</Grid>
					</Box>
					<Box mt="md" mb="xs">
						<Flex justify="flex-end" gap="sm">
							<Box>
								<SwitchForm
									tooltip={t("Status")}
									label={t("SMS")}
									nextField="ExpensePaymentFormSubmit"
									name="is_sms"
									form={form}
									id="is_sms"
									checked={form.values.is_sms}
								/>
								<SwitchForm
									tooltip={t("Status")}
									label={t("Approve")}
									nextField="ExpensePaymentFormSubmit"
									name="is_approve"
									form={form}
									mt="xs"
									id="is_approve"
									checked={form.values.is_approve}
								/>
							</Box>
							<Button
								size="sm"
								className="btnPrimaryBg"
								type="submit"
								id="ExpensePaymentFormSubmit"
								bg="var(--theme-primary-color-6)"
								c="white"
								mt="xs"
								ml="md"
								leftSection={<IconDeviceFloppy size={16} />}
							>
								<Text fz={14} fw={400}>
									{t("CreateAndSave")}
								</Text>
							</Button>
						</Flex>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
