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
import { IconCheck, IconInfoCircle, IconCircleKey } from "@tabler/icons-react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { MASTER_APIS } from "@/routes/routes";
import { useTranslation } from "react-i18next";
import DatabaseInsertProgress from "@components/DatabaseInsertProgress";
import { BRAND_IMAGE, DATA_MAP } from "@/constants";

// =============== threshold: arrays longer than this use clearAndInsertBulk ================
const BULK_INSERT_THRESHOLD = 1000;

export default function Activate() {
	const { t } = useTranslation();
	const [spinner, setSpinner] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [insertProgress, setInsertProgress] = useState(null);
	const [isInserting, setIsInserting] = useState(false);
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

	// =============== insert all tables sequentially so progress is displayed per-table ================
	const insertAllTables = async (responseData) => {
		window.dbAPI.onDBProgress((progress) => {
			setInsertProgress(progress);
		});

		setIsInserting(true);

		try {
			for (const [table, property] of Object.entries(DATA_MAP)) {
				// =============== config_data comes as a single object, not an array ================
				if (table === "config_data") {
					const configData = {
						data: JSON.stringify(responseData[property]),
					};
					await window.dbAPI.upsertIntoTable(table, configData);
					continue;
				}

				const dataList = Array.isArray(responseData[property])
					? responseData[property]
					: [responseData[property]];

				if (dataList.length > BULK_INSERT_THRESHOLD) {
					// =============== large dataset: use batched bulk insert with progress reporting ================
					await window.dbAPI.clearAndInsertBulk(table, dataList, { batchSize: 500 });
				} else {
					// =============== small dataset: upsert row by row, report progress manually ================
					const total = dataList.length;
					for (let index = 0; index < total; index++) {
						await window.dbAPI.upsertIntoTable(table, dataList[index]);
						setInsertProgress({
							table,
							inserted: index + 1,
							total,
							percent: Math.round(((index + 1) / total) * 100),
						});
					}
				}
			}

			// =============== insert default printer config after all table data ================
			await window.dbAPI.upsertIntoTable("printer", {
				printer_name: "POS-PRINT",
				line_character: "-",
				character_set: "PC437_USA",
			});
		} finally {
			window.dbAPI.removeDBProgressListener();
			setIsInserting(false);
			setInsertProgress(null);
		}
	};

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
				await window.dbAPI.upsertIntoTable("license_activate", {
					license_key: licenseKey,
					active_key: activeKey,
					is_activated: 1,
				});

				setSpinner(false);
				await insertAllTables(response.data.data);

				navigate("/login", { replace: true });
			} else {
				setErrorMessage(response.data.message);
				setSpinner(false);
			}
		} catch (error) {
			setErrorMessage(
				error?.response?.data.message || error?.message || "Account activation failed"
			);
			console.error(error);
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

				{/* =============== progress overlay shown during bulk db inserts ================ */}
				<DatabaseInsertProgress visible={isInserting} progress={insertProgress} />

				<Paper radius="md" p="xl" withBorder shadow="lg">
					<Box ta="center" mb="md">
						<img src={`./${BRAND_IMAGE}`} height="90px" alt="Sandra" />
					</Box>

					<Stack gap="lg">
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
							<Stack gap="md">
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
										leftSection={<IconCircleKey stroke={1.2} size={24} />}
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
										<Group justify="center" mb={5}>
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
									leftSection={<IconCheck size={18} />}
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
