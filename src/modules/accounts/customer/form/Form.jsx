import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import {
	Button,
	rem,
	Flex,
	Grid,
	Box,
	ScrollArea,
	Text,
	LoadingOverlay,
	Select,
	Textarea,
	Group,
	Image, ActionIcon
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconCheck, IconDeviceFloppy, IconPercentage, IconPlusMinus, IconUserPlus, IconX } from "@tabler/icons-react";
import { useHotkeys } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

import InputForm from "@components/form-builders/InputForm";
import SelectForm from "@components/form-builders/SelectForm";
import TextAreaForm from "@components/form-builders/TextAreaForm";
import PhoneNumber from "@components/form-builders/PhoneNumberInput.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import { customerRequest } from "../helpers/request.js";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "@services/core/customer.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import { useGetDropdownDataQuery } from "@services/settings.js";
import SwitchForm from "@components/form-builders/SwitchForm";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper";
import useTransactionMode from "@hooks/useTransactionMode";

export default function Form({ mode = "create", entityEditData = null, onSuccess, isEditMode = false, resetKey = 0, }) {
	const { data: customerGroupData } = useGetDropdownDataQuery({
		"dropdown-type": "customer-group",
	});
	const [ createCustomer, { isLoading: isCreateCustomerLoading } ] = useCreateCustomerMutation();
	const [ updateCustomer, { isLoading: isUpdateCustomerLoading } ] = useUpdateCustomerMutation();
	const { t } = useTranslation();
	const { isOnline } = useOutletContext();
	const { mainAreaHeight } = useMainAreaHeight();
	const height = mainAreaHeight - 130;
	const { transactionMode } = useTransactionMode();
	const [ customersDropdownData, setCustomersDropdownData ] = useState([]);

	const form = useForm(customerRequest(t));

	const [ groupDrawer, setGroupDrawer ] = useState(false);

	// =============== populate form for update mode ================
	useEffect(() => {
		if (mode === "update" && entityEditData) {
			form.setValues({
				name: entityEditData?.name || "",
				customer_group_id: String(entityEditData?.customer_group_id) || "",
				credit_limit: entityEditData?.credit_Limit || "",
				reference_id: entityEditData?.reference_id || "",
				mobile: entityEditData?.mobile || "",
				alternative_mobile: entityEditData?.alternative_mobile || "",
				email: entityEditData?.email || "",
				location_id: entityEditData?.location_id || "",
				marketing_id: entityEditData?.marketing_id || "",
				discount_percent: entityEditData?.discount_percent || "",
				address: entityEditData?.address || "",
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ entityEditData, mode ]);

	useHotkeys(
		[
			[
				"alt+n",
				() => {
					!groupDrawer && document.getElementById("customer_group_id").click();
				},
			],
			[
				"alt+r",
				() => {
					handleFormReset();
				},
			],
			[
				"alt+s",
				() => {
					!groupDrawer && document.getElementById("EntityFormSubmit").click();
				},
			],
		],
		[]
	);

	const handleFormReset = () => {
		if (mode === "update" && entityEditData && Object.keys(entityEditData).length > 0) {
			const originalValues = {
				customer_group_id: entityEditData?.customer_group_id || "",
				transaction_method: entityEditData?.transaction_method || "",
				amount: entityEditData?.amount || "",
			};
			form.setValues(originalValues);
		} else {
			form.reset();
		}
	};

	const handleSubmit = (values) => {
		modals.openConfirmModal({
			title: <Text size="md"> {t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
			labels: { confirm: t("Submit"), cancel: t("Cancel") },
			confirmProps: { color: "red" },
			onCancel: () => console.log("Cancel"),
			onConfirm: () => handleConfirmSubmit(values),
		});
	};

	const handleConfirmSubmit = async (values) => {
		if (mode === "create") {
			try {
				const response = await createCustomer(values).unwrap();
				if (response.data) {
					showNotification(t("CreateSuccessfully"), "teal");
					onSuccess();
				} else {
					showNotification(
						t("CreateFailed"),
						"red",
						"",
						<IconX style={{ width: rem(18), height: rem(18) }} />
					);
				}
			} catch (error) {
				console.error(error);
				showNotification(
					error?.data?.message || t("CreateFailed"),
					"red",
					"",
					<IconX style={{ width: rem(18), height: rem(18) }} />
				);
			}
		} else {
			try {
				const response = await updateCustomer({ ...values, id: entityEditData?.id }).unwrap();
				if (response.data) {
					showNotification(t("UpdateSuccessfully"), "teal");
					onSuccess();
				} else {
					showNotification(
						t("UpdateFailed"),
						"red",
						"",
						<IconX style={{ width: rem(18), height: rem(18) }} />
					);
				}
			} catch (error) {
				console.error(error);
				showNotification(
					error?.data?.message || t("UpdateFailed"),
					"red",
					"",
					<IconX style={{ width: rem(18), height: rem(18) }} />
				);
			}
		}
	};

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
		if (form.values.transactionModeId) return;

		const cashMethod = transactionMode.find((mode) => mode.slug === "cash");
		if (cashMethod) {
			form.setFieldValue("transactionModeId", String(cashMethod.id));
			form.setFieldValue("transactionMode", cashMethod.name);
		}
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

	const { narration } =
		form.values;

	return (
		<Box>
			<Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
				<Box bg="white">
					<LoadingOverlay
						visible={isCreateCustomerLoading || isUpdateCustomerLoading}
						zIndex={1000}
						overlayProps={{ radius: "sm", blur: 2 }}
						loaderProps={{ color: "red.6" }}
					/>
					<Box px="xs" className="border-radius-all">
						<Box>
							<Grid gutter={{ base: 6 }}>
								<Grid.Col span={3}>
									<Text fz="sm" fw={600} mt={6}>
										{t("SelectCustomer")}
									</Text>
								</Grid.Col>
								<Grid.Col span={9}>
									<Box>
										<FormValidationWrapper
											errorMessage={t("ChooseCustomer")}
											opened={!!form.errors.customer_id}
										>
											<Select
												id="customerSelect"
												key={resetKey}
												placeholder={t("ChooseCustomer")}
												data={dropdownOptions}
												searchable
												clearable
												value={form.values.customer_id}
												onChange={(value) => form.setFieldValue("customer_id", value ?? "")}
												size="sm"
												nothingFoundMessage={t("NoCustomerFound")}
											/>
										</FormValidationWrapper>
									</Box>
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
									<Box>
										<Text pt={'4'} fz={'18'} c={'red'} fw={'600'}>4324234</Text>
									</Box>
								</Grid.Col>
							</Grid>
						</Box>
						<Box mt={"xs"}>
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
										tooltip={t("DiscountPercentValidateMessage")}
										placeholder={t("ReceiveAmount")}
										required={false}
										nextField="EntityFormSubmit"
										name="amount"
										form={form}
										id="amount"
									/>
								</Grid.Col>
							</Grid>
						</Box>
						<Box mt={"xs"}>
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
										nextField="CategoryFormSubmit"
										name="is_sms"
										form={form}
										id="is_sms"
										checked={form.values.is_sms}
									/>
									<SwitchForm
										tooltip={t("Status")}
										label={t("Approve")}
										nextField="CategoryFormSubmit"
										name="is_approve"
										form={form}
										mt={'xs'}
										id="is_approve"
										checked={form.values.is_approve}
									/>
								</Box>
								{!isCreateCustomerLoading && !isUpdateCustomerLoading && isOnline && (
									<Button
										size="sm"
										className="btnPrimaryBg"
										type="submit"
										id="EntityFormSubmit"
										bg="var(--theme-primary-color-6)"
										c="white"
										mt={'xs'}
										ml={'md'}
										leftSection={<IconDeviceFloppy size={16} />}
									>
										<Text fz={14} fw={400}>
											{mode === "create" ? t("CreateAndSave") : t("UpdateAndSave")}
										</Text>
									</Button>
								)}
							</Flex>
						</Box>
					</Box>
				</Box>
			</Box>
		</Box>
	);
}
