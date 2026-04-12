import { useEffect } from "react";
import { useOutletContext } from "react-router";
import { Button, Flex, Grid, Box, ScrollArea, Text, LoadingOverlay } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useHotkeys } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

import InputForm from "@components/form-builders/InputForm";
import SelectForm from "@components/form-builders/SelectForm";
import SwitchForm from "@components/form-builders/SwitchForm";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import { particularRequest } from "../helpers/request.js";
import {
	useCreateParticularMutation,
	useUpdateParticularMutation,
	useGetParticularTypesQuery,
} from "@services/particular.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";

export default function Form({ mode = "create", entityEditData = null, onSuccess }) {
	const { data: particularTypeData } = useGetParticularTypesQuery();
	const [createParticular, { isLoading: isCreateLoading }] = useCreateParticularMutation();
	const [updateParticular, { isLoading: isUpdateLoading }] = useUpdateParticularMutation();
	const { t } = useTranslation();
	const { isOnline } = useOutletContext();
	const { mainAreaHeight } = useMainAreaHeight();
	const height = mainAreaHeight - 54;

	const form = useForm(particularRequest(t));

	useEffect(() => {
		if (mode === "update" && entityEditData) {
			form.setValues({
				particular_type_id: entityEditData?.particular_type_id
					? String(entityEditData.particular_type_id)
					: "",
				name: entityEditData?.name || "",
				status: entityEditData?.status === 1,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [entityEditData, mode]);

	useHotkeys(
		[
			["alt+r", () => handleFormReset()],
			["alt+s", () => document.getElementById("ParticularFormSubmit")?.click()],
		],
		[]
	);

	const handleFormReset = () => {
		if (mode === "update" && entityEditData) {
			form.setValues({
				particular_type_id: entityEditData?.particular_type_id
					? String(entityEditData.particular_type_id)
					: "",
				name: entityEditData?.name || "",
				status: entityEditData?.status === 1,
			});
		} else {
			form.reset();
		}
	};

	const handleSubmit = (values) => {
		modals.openConfirmModal({
			title: <Text size="md">{t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
			labels: { confirm: t("Submit"), cancel: t("Cancel") },
			confirmProps: { color: "red" },
			onConfirm: () => handleConfirmSubmit(values),
		});
	};

	const handleConfirmSubmit = async (values) => {
		if (mode === "create") {
			try {
				const response = await createParticular(values).unwrap();
				if (response.data) {
					showNotification(t("CreateSuccessfully"), "teal");
					form.reset();
					onSuccess?.();
				} else {
					showNotification(t("CreateFailed"), "red");
				}
			} catch (error) {
				console.error(error);
				showNotification(error?.data?.message || t("CreateFailed"), "red");
			}
		} else {
			try {
				const payload = {
					...values,
					setting_type_id: values.particular_type_id,
					id: entityEditData?.id,
				};
				const response = await updateParticular(payload).unwrap();
				if (response.data) {
					showNotification(t("UpdateSuccessfully"), "teal");
					onSuccess?.();
				} else {
					showNotification(t("UpdateFailed"), "red");
				}
			} catch (error) {
				console.error(error);
				showNotification(error?.data?.message || t("UpdateFailed"), "red");
			}
		}
	};

	return (
		<Box component="form" onSubmit={form.onSubmit(handleSubmit)}>
			<Box bg="white">
				<LoadingOverlay
					visible={isCreateLoading || isUpdateLoading}
					zIndex={1000}
					overlayProps={{ radius: "sm", blur: 2 }}
					loaderProps={{ color: "red.6" }}
				/>
				<Box px="xs" className="borderRadiusAll">
					<ScrollArea h={height} scrollbarSize={2} scrollbars="y" type="never">
						<Box>
							<Box mt="8">
								<SelectForm
									tooltip={t("ChooseSettingType")}
									label={t("SettingType")}
									placeholder={t("ChooseSettingType")}
									required={true}
									nextField="setting_name"
									name="particular_type_id"
									form={form}
									dropdownValue={particularTypeData?.data?.map((item) => ({
										value: String(item.id),
										label: item.name,
									}))}
									mt={8}
									id="particular_type_id"
									searchable={true}
								/>
							</Box>
							<Box mt="xs">
								<InputForm
									tooltip={t("SettingNameRequired")}
									label={t("SettingName")}
									placeholder={t("SettingName")}
									required={true}
									nextField="status"
									name="name"
									form={form}
									mt={0}
									id="setting_name"
								/>
							</Box>
							<Box mt="xs">
								<Grid gutter={{ base: 6 }}>
									<Grid.Col span={12}>
										<SwitchForm
											tooltip={t("Status")}
											label={t("Status")}
											nextField="ParticularFormSubmit"
											name="status"
											form={form}
											id="status"
											checked={form.values.status}
										/>
									</Grid.Col>
								</Grid>
							</Box>
						</Box>
					</ScrollArea>
					<Box mt="md" mb="xs">
						<Flex justify="flex-end" gap="sm">
							{!isCreateLoading && !isUpdateLoading && isOnline && (
								<Button
									size="sm"
									type="submit"
									id="ParticularFormSubmit"
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
	);
}
