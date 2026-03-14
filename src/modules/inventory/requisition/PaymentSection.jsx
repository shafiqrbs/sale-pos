import React, { useEffect, useMemo } from "react";
import {
	Box,
	Button,
	Grid,
	Stack,
	Textarea,
} from "@mantine/core";
import useTransactionMode from "@hooks/useTransactionMode";
import { useHotkeys } from "@mantine/hooks";
import DateInputForm from "@components/form-builders/DateInputForm";
import SelectForm from "@components/form-builders/SelectForm";
import { useGetVendorsQuery } from "@services/core/vendors";

export default function PaymentSection({
	itemsForm,
	itemsTotal,
	isAddingItem,
	isEditMode = false,
}) {
	const { transactionMode } = useTransactionMode();
	const { data: vendors } = useGetVendorsQuery();
	const { discountAmount, isDiscountPercentage, purchaseNarration } =
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

	useHotkeys([ [ "alt+s", () => document.getElementById("ItemsFormSubmit")?.click() ] ]);

	return (
		<>
			<Box bg={"gray.1"} p={"xs"}>
				<Grid columns={24} gutter={8}>
					<Grid.Col span={10}>
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
								<Grid.Col span={24}>
									<Textarea
										value={purchaseNarration}
										onChange={(event) =>
											itemsForm.setFieldValue("purchaseNarration", event.currentTarget.value)
										}
										placeholder="Narration"
										minRows={2}
									/>
								</Grid.Col>
							</Grid>
						</Stack>
					</Grid.Col>
					<Grid.Col span={10}>
						<Box bd="1px solid #dee2e6" h={'100'} bg="white" p="xs" className="borderRadiusAll">
							<Grid gutter={6}>
								<Grid.Col span={12}>
									<SelectForm
										name="vendor_id"
										form={itemsForm}
										dropdownValue={vendors?.data?.map((vendor) => ({
											value: String(vendor.id),
											label: vendor.name,
										}))}
										nextField="invoice_date"
										placeholder="Search vendor/supplier"
										tooltip="Vendor is required"
									/>
								</Grid.Col>
								<Grid.Col span={6}>
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
								<Grid.Col span={6}>
									<DateInputForm
										name="expected_date"
										form={itemsForm}
										id="expected_date"
										placeholder="DD-MM-YYYY"
										valueFormat="DD-MM-YYYY"
										clearable
										tooltip={itemsForm.errors.expected_date}
										{...itemsForm.getInputProps("expected_date")}
									/>
								</Grid.Col>
							</Grid>
						</Box>
					</Grid.Col>
					<Grid.Col span={4} bg={'gray.2'}>
						<Grid columns={16} gutter={8}>
							<Grid.Col span={16}>
								<Stack
									align="stretch"
									justify="flex-end"
									gap="1"
									h={'100'}
								>
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
										type="submit"
										loading={isAddingItem}
										id="ItemsFormSubmit"
									>
										{isEditMode ? "Update" : "Save"}
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
