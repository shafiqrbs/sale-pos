import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { Button, rem, Flex, Grid, Box, ScrollArea, Text, LoadingOverlay } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconDeviceFloppy, IconPercentage, IconPlusMinus, IconX } from "@tabler/icons-react";
import { useHotkeys } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

import InputForm from "@components/form-builders/InputForm";
import SelectForm from "@components/form-builders/SelectForm";
import TextAreaForm from "@components/form-builders/TextAreaForm";
import PhoneNumber from "@components/form-builders/PhoneNumberInput.jsx";
import CustomerGroupDrawer from "../CustomerGroupDrawer.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import { customerRequest } from "../helpers/request.js";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "@services/core/customer.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import { useGetDropdownDataQuery } from "@services/settings.js";

export default function Form({ mode = "create", entityEditData = null, onSuccess }) {
	const { data: customerGroupData } = useGetDropdownDataQuery({
		"dropdown-type": "customer-group",
	});
	const [createCustomer, { isLoading: isCreateCustomerLoading }] = useCreateCustomerMutation();
	const [updateCustomer, { isLoading: isUpdateCustomerLoading }] = useUpdateCustomerMutation();
	const { t } = useTranslation();
	const { isOnline } = useOutletContext();
	const { mainAreaHeight } = useMainAreaHeight();
	const height = mainAreaHeight - 130;

	const [locationData, setLocationData] = useState(null);
	const [marketingExeData, setMarketingExeData] = useState(null);

	const form = useForm(customerRequest(t));

	const [groupDrawer, setGroupDrawer] = useState(false);

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
	}, [entityEditData, mode]);

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
				name: entityEditData?.name || "",
				customer_group_id: entityEditData?.customer_group_id || "",
				credit_limit: entityEditData?.credit_Limit || "",
				reference_id: entityEditData?.reference_id || "",
				mobile: entityEditData?.mobile || "",
				alternative_mobile: entityEditData?.alternative_mobile || "",
				email: entityEditData?.email || "",
				location_id: entityEditData?.location_id || "",
				marketing_id: entityEditData?.marketing_id || "",
				discount_percent: entityEditData?.discount_percent || "",
				address: entityEditData?.address || "",
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
						<ScrollArea h={height} scrollbarSize={2} scrollbars="y" type="never">
							<Box>
								<Grid gutter={{ base: 6 }}>
									<Grid.Col span={12}>
										<Box mt="8">
											<SelectForm
												tooltip={t("ChooseCustomerGroup")}
												label={t("CustomerGroup")}
												placeholder={t("ChooseCustomerGroup")}
												required={true}
												nextField={"name"}
												name="customer_group_id"
												form={form}
												dropdownValue={customerGroupData?.data?.map((item) => ({
													value: String(item.id),
													label: item.name,
												}))}
												mt={8}
												id="customer_group_id"
											/>
										</Box>
									</Grid.Col>
									{/* {mode === 'create' && (
                                        <Grid.Col span={1}>
                                            <Box pt={"xl"}>
                                                <Tooltip
                                                    ta="center"
                                                    multiline
                                                    bg={"orange.8"}
                                                    offset={{ crossAxis: "-110", mainAxis: "5" }}
                                                    withArrow
                                                    transitionProps={{ duration: 200 }}
                                                    label={t("QuickCustomerGroup")}
                                                >
                                                    <ActionIcon
                                                        variant="outline"
                                                        bg={"white"}
                                                        size={"lg"}
                                                        color="red.5"
                                                        mt={"1"}
                                                        aria-label="Settings"
                                                        onClick={() => {
                                                            setGroupDrawer(true);
                                                        }}
                                                    >
                                                        <IconUsersGroup
                                                            style={{ width: "100%", height: "70%" }}
                                                            stroke={1.5}
                                                        />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Box>
                                        </Grid.Col>
                                    )} */}
								</Grid>
								<Box mt={"xs"}>
									<InputForm
										tooltip={t("NameValidateMessage")}
										label={t("Name")}
										placeholder={t("Name")}
										required={true}
										nextField={"mobile"}
										name={"name"}
										form={form}
										mt={0}
										id={"name"}
									/>
								</Box>
								<Box mt={"xs"}>
									<Grid gutter={{ base: 6 }}>
										<Grid.Col span={6}>
											<PhoneNumber
												tooltip={
													form.errors.mobile ? form.errors.mobile : t("MobileValidateMessage")
												}
												label={t("Mobile")}
												placeholder={t("Mobile")}
												required={true}
												nextField={"alternative_mobile"}
												name={"mobile"}
												form={form}
												mt={8}
												id={"mobile"}
											/>
										</Grid.Col>
										<Grid.Col span={6}>
											<PhoneNumber
												tooltip={
													form.errors.alternative_mobile
														? form.errors.alternative_mobile
														: t("MobileValidateMessage")
												}
												label={t("AlternativeMobile")}
												placeholder={t("AlternativeMobile")}
												required={false}
												nextField={"email"}
												name={"alternative_mobile"}
												form={form}
												mt={8}
												id={"alternative_mobile"}
											/>
										</Grid.Col>
									</Grid>
								</Box>
								<Box mt={"xs"}>
									<InputForm
										tooltip={t("InvalidEmail")}
										label={t("Email")}
										placeholder={t("Email")}
										required={false}
										nextField={"discount_percent"}
										name={"email"}
										form={form}
										mt={8}
										id={"email"}
									/>
								</Box>
								<Box mt={"xs"}>
									<InputForm
										type="number"
										leftSection={<IconPercentage size={16} opacity={0.5} />}
										tooltip={t("DiscountPercentValidateMessage")}
										label={t("DiscountPercent")}
										placeholder={t("DiscountPercent")}
										required={false}
										nextField="credit_limit"
										name="discount_percent"
										form={form}
										mt={8}
										id="discount_percent"
									/>
								</Box>
								<Box mt="xs">
									<Grid gutter={{ base: 6 }}>
										<Grid.Col span={6}>
											<InputForm
												type="number"
												leftSection={<IconPlusMinus size={16} opacity={0.5} />}
												tooltip={t("CreditLimitValidationMessage")}
												label={t("CreditLimit")}
												placeholder={t("CreditLimit")}
												required={false}
												nextField="reference_id"
												name={"credit_limit"}
												form={form}
												mt={8}
												id="credit_limit"
											/>
										</Grid.Col>
										<Grid.Col span={6}>
											<InputForm
												tooltip={t("OLDReferenceNoValidateMessage")}
												label={t("OLDReferenceNo")}
												placeholder={t("OLDReferenceNo")}
												required={false}
												nextField="location_id"
												name="reference_id"
												form={form}
												mt={8}
												id="reference_id"
											/>
										</Grid.Col>
									</Grid>
								</Box>
								<Box mt={"xs"}>
									<SelectForm
										tooltip={t("Location")}
										label={t("Location")}
										placeholder={t("ChooseLocation")}
										required={false}
										nextField="marketing_id"
										name="location_id"
										id="location_id"
										form={form}
										dropdownValue={locationData?.data?.map((item) => ({
											value: String(item.id),
											label: item.name,
										}))}
										mt={8}
										searchable={true}
										value={
											locationData
												? String(locationData)
												: entityEditData?.location_id
													? String(entityEditData.location_id)
													: null
										}
										changeValue={setLocationData}
									/>
								</Box>
								<Box mt={"xs"}>
									<SelectForm
										tooltip={t("MarketingExecutive")}
										label={t("MarketingExecutive")}
										placeholder={t("ChooseMarketingExecutive")}
										required={false}
										nextField="address"
										name="marketing_id"
										form={form}
										dropdownValue={marketingExeData?.data?.map((item) => ({
											value: String(item.id),
											label: item.name,
										}))}
										id="marketing_id"
										searchable={true}
										value={
											marketingExeData
												? String(marketingExeData)
												: entityEditData?.marketing_id
													? String(entityEditData.marketing_id)
													: null
										}
										changeValue={setMarketingExeData}
									/>
								</Box>
								<Box my="xs">
									<TextAreaForm
										tooltip={t("AddressValidateMessage")}
										label={t("Address")}
										placeholder={t("Address")}
										required={false}
										nextField="EntityFormSubmit"
										name="address"
										form={form}
										mt={8}
										id="address"
									/>
								</Box>
							</Box>
						</ScrollArea>
						<Box mt="md" mb="xs">
							<Flex justify="flex-end" gap="sm">
								{!isCreateCustomerLoading && !isUpdateCustomerLoading && isOnline && (
									<Button
										size="sm"
										className="btnPrimaryBg"
										type="submit"
										id="EntityFormSubmit"
										bg="var(--theme-primary-color-6)"
										c="white"
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

			<CustomerGroupDrawer
				groupDrawer={groupDrawer}
				setGroupDrawer={setGroupDrawer}
				saveId={"EntityDrawerSubmit"}
			/>
		</Box>
	);
}
