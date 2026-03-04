import { Box, Button, Flex, Grid, Textarea, TextInput } from "@mantine/core";
import GlobalModal from "./GlobalModal.jsx";
import { useTranslation } from "react-i18next";
import PhoneNumber from "@components/form-builders/PhoneNumberInput.jsx";
import { useForm } from "@mantine/form";
import { useAddVendorMutation } from "@services/core/vendors";
import { showNotification } from "@components/ShowNotificationComponent.jsx";

export default function AddVendorModal({ opened, onClose }) {
	const { t } = useTranslation();

	return (
		<GlobalModal opened={opened} onClose={onClose} title={t("AddVendor")} size="sm">
			<AddVendorModalForm onClose={onClose} />
		</GlobalModal>
	);
}

function AddVendorModalForm({ onClose }) {
	const { t } = useTranslation();
	const vendorForm = useForm({
		initialValues: {
			name: "",
			mobile: "+880",
			email: "",
			company_name: "",
			address: "",
		},
		validate: {
			name: (value) => (value.trim() === "" ? "Name is required" : null),
			mobile: (value) => {
				if (!value) return "Mobile is required";
				if (value.trim().length < 11) return "Mobile must be at least 11 digits";
				return null;
			},
			email: (value) => (value.trim() === "" ? "Email is required" : null),
		},
	});
	const [addVendor, { isLoading }] = useAddVendorMutation();

	const handleSubmit = async (values) => {
		try {
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

	return (
		<Box component="form" id="vendorForm">
			<Grid gutter={6}>
				<Grid.Col span={12}>
					<TextInput
						value={vendorForm.values.name}
						onChange={(event) => vendorForm.setFieldValue("name", event.currentTarget.value)}
						placeholder="Vendor Name"
						size="xs"
						name="name"
					/>
				</Grid.Col>
				<Grid.Col span={12}>
					<PhoneNumber form={vendorForm} name="mobile" placeholder="+880" size="xs" required />
				</Grid.Col>
				<Grid.Col span={12}>
					<TextInput
						value={vendorForm.values.email}
						onChange={(event) => vendorForm.setFieldValue("email", event.currentTarget.value)}
						placeholder="Email"
						size="xs"
						name="email"
					/>
				</Grid.Col>
				<Grid.Col span={12}>
					<TextInput
						value={vendorForm.values.company_name}
						onChange={(event) =>
							vendorForm.setFieldValue("company_name", event.currentTarget.value)
						}
						placeholder="Company Name"
						name="company_name"
					/>
				</Grid.Col>
				<Grid.Col span={12}>
					<Textarea
						value={vendorForm.values.address}
						onChange={(event) => vendorForm.setFieldValue("address", event.currentTarget.value)}
						placeholder="Address"
						name="address"
						minRows={2}
						maxRows={4}
					/>
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
	);
}
