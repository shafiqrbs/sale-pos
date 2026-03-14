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
} from "@mantine/core";
import {IconCheck, IconCurrencyTaka, IconNumber123, IconPercentage, IconUserPlus} from "@tabler/icons-react";
import useConfigData from "@hooks/useConfigData";
import useTransactionMode from "@hooks/useTransactionMode";
import { formatCurrency } from "@utils/index";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import { useHotkeys } from "@mantine/hooks";
import DateInputForm from "@components/form-builders/DateInputForm";
import SelectForm from "@components/form-builders/SelectForm";
import {useGetVendorsQuery} from "@services/core/vendors";

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
	const { data: vendors } = useGetVendorsQuery();
	const { discountAmount, isDiscountPercentage, purchaseNarration, paymentAmount } =
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
		if (purchaseForm.values.transactionModeId) return;

		const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
		if (cashMethod) {
			purchaseForm.setFieldValue("transactionModeId", String(cashMethod.id));
			purchaseForm.setFieldValue("transactionMode", cashMethod.name);
		}
	}, [ transactionMode ]);

	// =============== auto-populate payment amount with grand total ===============
	useEffect(() => {
		if (isEditMode) return;
		purchaseForm.setFieldValue("paymentAmount", grandTotal);
	}, [ grandTotal ]);

	// =============== toggle between flat and percentage discount; reset amount on switch ===============
	const toggleDiscountType = () => {
		purchaseForm.setFieldValue("discountAmount", 0);
		purchaseForm.setFieldValue("isDiscountPercentage", !isDiscountPercentage);
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

	useHotkeys([ [ "alt+s", () => document.getElementById("PurchaseFormSubmit")?.click() ] ]);

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
											purchaseForm.setFieldValue("purchaseNarration", event.currentTarget.value)
										}
										placeholder="Narration"
										minRows={2}
									/>
								</Grid.Col>
							</Grid>
						</Stack>
					</Grid.Col>
					<Grid.Col span={10}>
						<Box  h={'100'} bg="white" p="xs" className="borderRadiusAll">
							<Grid gutter={6}>
								<Grid.Col span={12}>
									<Select
										name="return_mode"
										form={purchaseForm}
										data={['Refund', 'Exchange', 'Store Credit']}
										nextField="invoice_date"
										placeholder="Search Return Mode"
										tooltip="Return mode is required"
									/>
								</Grid.Col>
								<Grid.Col span={12}>
									<DateInputForm
										name="invoice_date"
										form={purchaseForm}
										id="invoice_date"
										placeholder="DD-MM-YYYY"
										valueFormat="DD-MM-YYYY"
										nextField="expected_date"
										clearable
										tooltip={purchaseForm.errors.invoice_date}
										{...purchaseForm.getInputProps("invoice_date")}
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
										form="purchaseForm"
										type="submit"
										loading={isAddingPurchase}
										id="PurchaseFormSubmit"
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
