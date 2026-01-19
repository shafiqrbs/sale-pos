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

const dataMap = {
	core_customers: "customers",
	core_users: "users",
	core_vendors: "vendors",
	accounting_transaction_mode: "transaction_modes",
	config_data: "domain_config",
	core_products: "stock_item",
};

export default function Activate() {
	const [ spinner, setSpinner ] = useState(false);
	const [ errorMessage, setErrorMessage ] = useState("");
	const navigate = useNavigate();
	const form = useForm({
		initialValues: {
			licenseKey: "",
			activeKey: "",
		},
		validate: {
			licenseKey: (value) => (value.length < 11 ? "License key must be 11 characters" : null),
			activeKey: (value) =>
				value.length < 10 ? "Activation key must be 10 characters" : null,
		},
	});

	const handleSubmit = form.onSubmit(async (values) => {
		setSpinner(true);
		setErrorMessage("");

		try {
			const response = await axios({
				method: "GET",
				url: `${import.meta.env.VITE_API_GATEWAY_URL}core/splash-info?license_key=${values.licenseKey
					}&active_key=${values.activeKey}`,
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.data.status === 200) {
				window.dbAPI.upsertIntoTable("license_activate", {
					license_key: values.licenseKey,
					active_key: values.activeKey,
					is_activated: 1,
				});

				const operations = Object.entries(dataMap).map(([ table, property ]) => {
					const dataList = Array.isArray(response.data.data[ property ])
						? response.data.data[ property ]
						: [ response.data.data[ property ] ];

					return dataList.map((data) => {
						if (table === "config_data") {
							data = {
								data: JSON.stringify(data),
							};
						}
						return window.dbAPI.upsertIntoTable(table, data);
					});
				});

				await Promise.all(operations);
				// await commonDataStoreIntoLocalStorage(response.data?.data?.domain_config?.id);

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
	}, [ navigate ]);

	return (
		<Box
			component="section"
			mih="100vh"
			style={{ display: "flex", alignItems: "center", backgroundColor: "#f8f9fa" }}
		>
			<Container size="sm" py="xl" pos="relative">
				<LoadingOverlay
					visible={spinner}
					zIndex={1000}
					overlayProps={{ radius: "sm", blur: 2 }}
				/>
				<Paper radius="md" p="xl" withBorder shadow="lg">
					<Box ta="center" mb="md">
						<img src="./sandra.jpg" height="90px" alt="Sandra" />
					</Box>

					<Stack spacing="lg">
						<Box ta="center" mb="md">
							<Title order={2} fw={700} c="red.7">
								Activate Your Account
							</Title>
							<Text c="gray.7" size="sm" mt="xs">
								Enter your license details to activate your account
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
										label="License Key"
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
										Activation Key{" "}
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
														borderColor: form.errors.activeKey
															? theme.colors.red[ 5 ]
															: undefined,
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
									gradient={{ from: "green.6", to: "green.8", deg: 160 }}
									variant="gradient"
								>
									Activate Account
								</Button>
							</Stack>
						</Box>
					</Stack>
				</Paper>
			</Container>
		</Box>
	);
}
