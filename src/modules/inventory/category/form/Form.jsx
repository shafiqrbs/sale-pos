import { useEffect } from "react";
import { useOutletContext } from "react-router";
import { Button, Flex, Grid, Box, ScrollArea, Text, LoadingOverlay, Divider } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useHotkeys } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";

import InputForm from "@components/form-builders/InputForm";
import SelectForm from "@components/form-builders/SelectForm";
import SwitchForm from "@components/form-builders/SwitchForm";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import { categoryRequest } from "../helpers/request.js";
import {
	useCreateCategoryMutation,
	useUpdateCategoryMutation,
	useGetParentCategoriesQuery,
} from "@services/category.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";

export default function Form({ mode = "create", entityEditData = null, onSuccess }) {
	const { data: parentCategoryData } = useGetParentCategoriesQuery();
	const [createCategory, { isLoading: isCreateLoading }] = useCreateCategoryMutation();
	const [updateCategory, { isLoading: isUpdateLoading }] = useUpdateCategoryMutation();
	const { t } = useTranslation();
	const { isOnline } = useOutletContext();
	const { mainAreaHeight } = useMainAreaHeight();
	const height = mainAreaHeight - 54;

	const form = useForm(categoryRequest(t));

	useEffect(() => {
		if (mode === "update" && entityEditData) {
			form.setValues({
				parent: entityEditData?.parent ? String(entityEditData.parent) : "",
				name: entityEditData?.name || "",
				expiry_duration: entityEditData?.expiry_duration ?? "",
				status: entityEditData?.status === 1,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [entityEditData, mode]);

	useHotkeys(
		[
			["alt+r", () => handleFormReset()],
			["alt+s", () => document.getElementById("CategoryFormSubmit")?.click()],
		],
		[]
	);

	const handleFormReset = () => {
		if (mode === "update" && entityEditData) {
			form.setValues({
				parent: entityEditData?.parent ? String(entityEditData.parent) : "",
				name: entityEditData?.name || "",
				expiry_duration: entityEditData?.expiry_duration ?? "",
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
		const payload = {
			...values,
			expiry_duration: values.expiry_duration || null,
		};

		if (mode === "create") {
			try {
				const response = await createCategory(payload).unwrap();
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
				const response = await updateCategory({ ...payload, id: entityEditData?.id }).unwrap();
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
									tooltip={t("ChooseCategoryGroup")}
									label={t("CategoryGroup")}
									placeholder={t("ChooseCategoryGroup")}
									required={true}
									nextField="category_name"
									name="parent"
									form={form}
									dropdownValue={parentCategoryData?.data?.map((item) => ({
										value: String(item.id),
										label: item.name,
									}))}
									mt={8}
									id="parent"
									searchable={true}
								/>
							</Box>
							<Box mt="xs">
								<InputForm
									tooltip={t("CategoryNameValidateMessage")}
									label={t("CategoryName")}
									placeholder={t("CategoryName")}
									required={true}
									nextField="expiry_duration"
									name="name"
									form={form}
									mt={0}
									id="category_name"
								/>
							</Box>
							<Box mt="xs">
								<InputForm
									type="number"
									tooltip={t("ExpiryDurationValidateMessage")}
									label={t("ExpiryDuration")}
									placeholder={t("ExpiryDuration")}
									nextField="status"
									name="expiry_duration"
									form={form}
									mt={8}
									id="expiry_duration"
								/>
							</Box>
							<Box mt="xs">
								<Grid gutter={{ base: 6 }}>
									<Grid.Col span={12}>
										<SwitchForm
											tooltip={t("Status")}
											label={t("Status")}
											nextField="CategoryFormSubmit"
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
									id="CategoryFormSubmit"
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
