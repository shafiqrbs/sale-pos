import {
	Box,
	Button,
	Container,
	PinInput,
	Text,
	TextInput,
	Title,
	Paper,
	Stack,
	Group,
	Tooltip,
	Alert,
	LoadingOverlay,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconKey, IconCheck, IconInfoCircle } from "@tabler/icons-react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { MASTER_APIS } from "@/routes/routes";
import { useTranslation } from "react-i18next";

const dataMap = {
	core_customers: "customers",
	core_users: "users",
	core_vendors: "vendors",
	accounting_transaction_mode: "transaction_modes",
	config_data: "domain_config",
	core_products: "stock_item",
};

export default function Activate() {
	const { t } = useTranslation();
	const [spinner, setSpinner] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const navigate = useNavigate();

	const form = useForm({
		initialValues: {
			licenseKey: "",
			activeKey: "",
		},
		validate: {
			licenseKey: (value) => (value.length < 11 ? t("LicenseKeyMustBe11Characters") : null),
			activeKey: (value) => (value.length < 10 ? t("ActivationKeyMustBe10Characters") : null),
		},
	});

	const handleSubmit = form.onSubmit(async (values) => {
		setSpinner(true);
		setErrorMessage("");

		try {
			const licenseKey = values.licenseKey?.toString().trim();
			const activeKey = values.activeKey?.toString().trim();

			const response = await axios({
				url: `${MASTER_APIS.SPLASH}?license_key=${licenseKey}&active_key=${activeKey}`,
			});

			if (response.data.status === 200) {
				window.dbAPI.upsertIntoTable("license_activate", {
					license_key: licenseKey,
					active_key: activeKey,
					is_activated: 1,
				});

				const operations = Object.entries(dataMap).map(([table, property]) => {
					const dataList = Array.isArray(response.data.data[property])
						? response.data.data[property]
						: [response.data.data[property]];

					return dataList.map((data) => {
						if (table === "config_data") {
							data = {
								data: JSON.stringify(data),
							};
						}
						return window.dbAPI.upsertIntoTable(table, data);
					});
				});

				const setPrinter = window.dbAPI.upsertIntoTable("printer", {
					printer_name: "POS-PRINT",
					line_character: "-",
					character_set: "PC437_USA",
				});

				await Promise.all([...operations, setPrinter]);

				navigate("/login", { replace: true });
			} else {
				setErrorMessage(response.data.message);
			}
		} catch (error) {
			setErrorMessage(
				error?.response?.data.message || error?.message || "Account activation failed"
			);

			console.error(error);
		} finally {
			setSpinner(false);
		}
	});

	useEffect(() => {
		const checkActivation = async () => {
			const activationData = await window.dbAPI.getDataFromTable("license_activate");
			if (activationData?.is_activated) {
				navigate("/", { replace: true });
			}
		};
		checkActivation();
	}, [navigate]);

	return (
		<Box
			component="section"
			mih="100vh"
			style={{ display: "flex", alignItems: "center", backgroundColor: "#f8f9fa" }}
		>
			<Container size="sm" py="xl" pos="relative">
				<LoadingOverlay visible={spinner} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
				<Paper radius="md" p="xl" withBorder shadow="lg">
					<Box ta="center" mb="md">
						<img src="./sandra.jpg" height="90px" alt="Sandra" />
					</Box>

					<Stack spacing="lg">
						<Box ta="center" mb="md">
							<Title order={2} fw={700} c="red.7">
								{t("ActivateYourAccount")}
							</Title>
							<Text c="gray.7" size="sm" mt="xs">
								{t("EnterLicenseDetails")}
							</Text>
						</Box>

						<Box component="form" onSubmit={handleSubmit}>
							{errorMessage && (
								<Alert
									variant="light"
									color="red"
									radius="md"
									title={errorMessage}
									icon={<IconInfoCircle />}
									mb="md"
								/>
							)}
							<Stack spacing="md">
								<Tooltip
									label={form.errors.licenseKey}
									px={20}
									py={3}
									opened={!!form.errors.licenseKey}
									position="top-end"
									color="red"
									withArrow
									offset={2}
									transitionProps={{
										transition: "pop-bottom-left",
										duration: 500,
									}}
								>
									<TextInput
										label={t("EnterLicenseKey")}
										placeholder="XXX-XXXXX-XXX"
										icon={<IconKey size={16} />}
										withAsterisk
										{...form.getInputProps("licenseKey")}
										error={!!form.errors.licenseKey}
										size="md"
										radius="md"
									/>
								</Tooltip>

								<Box>
									<Text fw={500} mb={5} c="dark">
										{t("ActivationKey")}{" "}
										<Box component="span" c="red">
											*
										</Box>
									</Text>
									<Tooltip
										label={form.errors.activeKey}
										px={20}
										py={3}
										opened={!!form.errors.activeKey}
										position="top-end"
										color="red"
										withArrow
										offset={2}
										transitionProps={{
											transition: "pop-bottom-left",
											duration: 500,
										}}
									>
										<Group position="center" mb={5}>
											<PinInput
												withAsterisk
												name="activeKey"
												id="pin"
												size="md"
												length={10}
												type="number"
												{...form.getInputProps("activeKey")}
												styles={(theme) => ({
													input: {
														borderColor: form.errors.activeKey ? theme.colors.red[5] : undefined,
													},
												})}
											/>
										</Group>
									</Tooltip>
								</Box>

								<Button
									id="activateSubmit"
									type="submit"
									fullWidth
									size="md"
									radius="md"
									mt="md"
									leftIcon={<IconCheck size={18} />}
									gradient={{
										from: "var(--theme-secondary-color-6)",
										to: "var(--theme-secondary-color-8)",
										deg: 160,
									}}
									variant="gradient"
								>
									{t("ActivateAccount")}
								</Button>
							</Stack>
						</Box>
					</Stack>
				</Paper>
			</Container>
		</Box>
	);
}
