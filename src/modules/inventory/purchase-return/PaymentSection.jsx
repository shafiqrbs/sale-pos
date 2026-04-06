import React, { useEffect, useMemo } from "react";
import { Box, Button, Grid, Select, Stack, Text, Textarea } from "@mantine/core";
import useTransactionMode from "@hooks/useTransactionMode";
import { useHotkeys } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import DateInputForm from "@components/form-builders/DateInputForm";

export default function PaymentSection({
	itemsForm,
	itemsTotal,
	isAddingItem,
	isEditMode = false,
}) {
	const { t } = useTranslation();
	const { transactionMode } = useTransactionMode();
	const { discountAmount, isDiscountPercentage, purchaseNarration } = itemsForm.values;

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

	useHotkeys([
		["alt+s", () => document.getElementById("ItemsFormSubmit")?.click()],
		["alt+p", () => document.getElementById("PurchasePrintFormSubmit")?.click()],
	]);

	return (
		<>
			<Box bg={"gray.1"} p={"xs"}>
				<Grid columns={24} gutter={8}>
					<Grid.Col span={10}>
						<Stack
							bg="white"
							p="xs"
							className="borderRadiusAll"
							h="100%"
							justify="space-between"
							gap={0}
						>
							<Grid columns={24} gutter={{ base: 4 }}>
								<Grid.Col span={24}>
									<Textarea
										value={purchaseNarration}
										onChange={(event) =>
											itemsForm.setFieldValue("purchaseNarration", event.currentTarget.value)
										}
										placeholder={t("Narration")}
										minRows={2}
									/>
								</Grid.Col>
							</Grid>
						</Stack>
					</Grid.Col>
					<Grid.Col span={10}>
						<Box h={"100"} bg="white" p="xs" className="borderRadiusAll">
							<Grid gutter={6}>
								<Grid.Col span={12}>
									<Select
										name="return_mode"
										form={itemsForm}
										data={[
											{ value: "Refund", label: t("Refund") },
											{ value: "Exchange", label: t("Exchange") },
											{ value: "Store Credit", label: t("StoreCredit") },
										]}
										nextField="invoice_date"
										placeholder={t("SearchReturnMode")}
										tooltip={t("ReturnModeRequired")}
									/>
								</Grid.Col>
								<Grid.Col span={12}>
									<DateInputForm
										name="invoice_date"
										form={itemsForm}
										id="invoice_date"
										placeholder="DD-MM-YYYY"
										valueFormat="DD-MM-YYYY"
										nextField="expected_date"
										clearable
										tooltip={itemsForm.errors.invoice_date}
										{...itemsForm.getInputProps("invoice_date")}
									/>
								</Grid.Col>
							</Grid>
						</Box>
					</Grid.Col>
					<Grid.Col span={4} bg={"gray.2"}>
						<Grid columns={16} gutter={8}>
							<Grid.Col span={16}>
								<Stack align="stretch" justify="flex-end" gap="1" h={"100"}>
									<Button
										fullWidth
										bg="var(--theme-print-btn-color)"
										color="white"
										radius={0}
										type="button"
										id="PurchasePrintFormSubmit"
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
								</Stack>
							</Grid.Col>
						</Grid>
					</Grid.Col>
				</Grid>
			</Box>
		</>
	);
}
