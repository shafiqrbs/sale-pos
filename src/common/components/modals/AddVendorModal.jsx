import { Box, Button, Flex, Grid, Textarea, TextInput } from "@mantine/core";
import GlobalModal from "./GlobalModal.jsx";
import { useTranslation } from "react-i18next";
import PhoneNumber from "@components/form-builders/PhoneNumberInput.jsx";
import { useForm } from "@mantine/form";
import { useAddVendorMutation } from "@services/core/vendors";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import FormValidationWrapper from "@components/form-builders/FormValidationWrapper.jsx";

export default function AddVendorModal({ opened, onClose }) {
	const { t } = useTranslation();
	const [addVendor, { isLoading }] = useAddVendorMutation();

	const vendorForm = useForm({
		initialValues: {
			name: "",
			mobile: "+880",
			email: "",
			company_name: "",
			address: "",
		},
		validate: {
			name: (value) => (value.trim() === "" ? t("NameIsRequired") : null),
			mobile: (value) => {
				if (!value) return t("MobileIsRequired");
				if (value.trim().length < 11) return t("MobileMinLength");
				return null;
			},
			email: (value) => (value.trim() === "" ? t("EmailIsRequired") : null),
			company_name: (value) => (value.trim() === "" ? t("CompanyNameRequired") : null),
		},
	});

	const handleSubmit = async (values) => {
		try {
			const isFormValid = vendorForm.validate();

			if (isFormValid.hasErrors) return;

			const response = await addVendor({
				name: values.name,
				mobile: values.mobile,
				email: values.email,
				company_name: values.company_name || "",
				address: values.address || "",
			});
			if (response.data) {
				showNotification(t("CreateSuccessfully"), "teal");
				vendorForm.reset();
				onClose();
			} else {
				showNotification(t("CreateFailed"), "red");
			}
		} catch (error) {
			console.error(error);
			showNotification(t("CreateFailed"), "red");
		}
	};

	const handleOnClose = () => {
		vendorForm.reset();
		onClose();
	};

	return (
		<GlobalModal opened={opened} onClose={handleOnClose} title={t("AddVendor")} size="sm">
			<Box component="form" id="vendorForm">
				<Grid gutter={6}>
					<Grid.Col span={12}>
						<FormValidationWrapper
							errorMessage={vendorForm.errors.name}
							opened={!!vendorForm.errors.name}
						>
							<TextInput
								value={vendorForm.values.name}
								onChange={(event) => vendorForm.setFieldValue("name", event.currentTarget.value)}
								placeholder={t("VendorName")}
								size="xs"
								name="name"
							/>
						</FormValidationWrapper>
					</Grid.Col>
					<Grid.Col span={12}>
						<PhoneNumber
							form={vendorForm}
							name="mobile"
							placeholder="+880"
							size="xs"
							required
							tooltip={vendorForm.errors.mobile}
							opened={!!vendorForm.errors.mobile}
						/>
					</Grid.Col>
					<Grid.Col span={12}>
						<FormValidationWrapper
							errorMessage={vendorForm.errors.email}
							opened={!!vendorForm.errors.email}
						>
							<TextInput
								value={vendorForm.values.email}
								onChange={(event) => vendorForm.setFieldValue("email", event.currentTarget.value)}
								placeholder={t("Email")}
								size="xs"
								name="email"
							/>
						</FormValidationWrapper>
					</Grid.Col>
					<Grid.Col span={12}>
						<FormValidationWrapper
							errorMessage={vendorForm.errors.company_name}
							opened={!!vendorForm.errors.company_name}
						>
							<TextInput
								value={vendorForm.values.company_name}
								onChange={(event) =>
									vendorForm.setFieldValue("company_name", event.currentTarget.value)
								}
								placeholder={t("CompanyName")}
								name="company_name"
							/>
						</FormValidationWrapper>
					</Grid.Col>
					<Grid.Col span={12}>
						<FormValidationWrapper
							errorMessage={vendorForm.errors.address}
							opened={!!vendorForm.errors.address}
						>
							<Textarea
								value={vendorForm.values.address}
								onChange={(event) => vendorForm.setFieldValue("address", event.currentTarget.value)}
								placeholder={t("Address")}
								name="address"
								minRows={2}
								maxRows={4}
							/>
						</FormValidationWrapper>
					</Grid.Col>
				</Grid>
				<Flex justify="flex-end" mt="xs">
					<Button
						size="sm"
						form="vendorForm"
						onClick={vendorForm.onSubmit(handleSubmit)}
						loading={isLoading}
					>
						{t("AddVendor")}
					</Button>
				</Flex>
			</Box>
		</GlobalModal>
	);
}
