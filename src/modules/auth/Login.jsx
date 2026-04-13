import {
	Paper,
	TextInput,
	PasswordInput,
	Button,
	Title,
	Alert,
	Tooltip,
	Center,
	Box,
	Loader,
	Flex,
	Text,
	Stack,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import LoginPage from "@assets/css/LoginPage.module.css";
import classes from "@assets/css/AuthenticationImage.module.css";
import { getHotkeyHandler, useHotkeys } from "@mantine/hooks";
import { IconInfoCircle, IconLogin } from "@tabler/icons-react";
import { isNotEmpty, useForm } from "@mantine/form";
import { Navigate, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { APP_NAVLINKS } from "@/routes/routes";
import { APP_NAME, COVER_IMAGE } from "@/constants";
import useConfigData from "@hooks/useConfigData";

export default function Login() {
	const { is_pos } = useConfigData();
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const icon = <IconInfoCircle />;
	const [spinner, setSpinner] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [activated, setActivated] = useState({ is_activated: false });

	const [height, setHeight] = useState(window.innerHeight);
	useEffect(() => {
		const handleResize = () => setHeight(window.innerHeight);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const [res, storedConfigData] = await Promise.all([
					window.dbAPI.getDataFromTable("users"),
					window.dbAPI.getDataFromTable("config-data"),
				]);
				setUser(res);
				if (res?.id) {
					// =============== use the locally stored is_pos flag to land on the correct page instead of hardcoding bakery ================
					const parsedConfig = storedConfigData?.data ? JSON.parse(storedConfigData.data) : {};
					const isPosEnabled = parsedConfig?.inventory_config?.is_pos ?? parsedConfig?.is_pos ?? 0;
					navigate(isPosEnabled ? APP_NAVLINKS.BAKERY : APP_NAVLINKS.SALES_NEW, { replace: true });
				}
			} catch (error) {
				console.error("Auth check error:", error);
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, [navigate]);

	useEffect(() => {
		async function checkActivation() {
			const activationData = await window.dbAPI.getDataFromTable("license_activate");
			setActivated(activationData);
		}

		checkActivation();
	}, []);

	useHotkeys([["alt+n", () => document.getElementById("Username")?.focus()]], []);

	const form = useForm({
		initialValues: { username: "", password: "" },
		validate: {
			username: isNotEmpty(),
			password: isNotEmpty(),
		},
	});

	if (loading) {
		return (
			<Center h="100vh">
				<Loader size="lg" />
			</Center>
		);
	}

	if (!activated?.is_activated) {
		return <Navigate replace to={APP_NAVLINKS.ACTIVATE} />;
	}

	// if already authenticated, don't render the login form
	if (user?.id) {
		return null;
	}

	async function login(data) {
		setSpinner(true);
		setErrorMessage("");

		try {
			const response = await window.authAPI.loginUser(data);

			if (response?.status === 200) {
				window.dbAPI.upsertIntoTable("users", response.data);

				navigate(is_pos ? APP_NAVLINKS.BAKERY : APP_NAVLINKS.SALES_NEW, { replace: true });
			} else {
				setErrorMessage(t(response?.message || "InvalidCredentials"));
			}
		} catch (error) {
			setErrorMessage(t("LoginFailed"));
			console.error(error);
		} finally {
			setSpinner(false);
		}
	}

	const openResetModal = () => {
		modals.openConfirmModal({
			title: "Reset local data?",
			children: (
				<Text size="sm">
					Are you sure you want to reset your local data? This action is destructive and you will
					lose all of your local data which aren&apos;t synced yet.
				</Text>
			),
			labels: { confirm: "Reset now", cancel: "No don't reset it" },
			confirmProps: { bg: "var(--theme-tertiary-color-2)", c: "var(--theme-tertiary-color-7)" },
			cancelProps: { bg: "var(--theme-primary-color-6)", c: "var(--theme-primary-color-0)" },

			onCancel: () => console.info("Cancel"),
			onConfirm: async () => {
				await window.dbAPI.resetDatabase();
				await window.dbAPI.relaunchApp();
			},
		});
	};

	return (
		<Box className={classes.wrapper}>
			<Box component="form" onSubmit={form.onSubmit(login)}>
				<Stack h={height} bg="var(--mantine-color-body)" align="stretch" justify="center" gap="md">
					<Paper className={classes.form} radius={0} p={30}>
						<Title
							order={2}
							className={`${classes.title} ${classes.formTitle}`}
							ta="center"
							mt="md"
						>
							Welcome Back to {APP_NAME}
						</Title>
						{errorMessage && (
							<Alert
								variant="light"
								color="red"
								radius="md"
								title={errorMessage}
								icon={icon}
								mb="md"
							/>
						)}
						<Box className={classes.inputWrapper}>
							<Tooltip
								label={t("UserNameRequired")}
								px={20}
								py={3}
								opened={!!form.errors.username}
								position="top-end"
								color="red"
								withArrow
								offset={2}
								transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
							>
								<TextInput
									withAsterisk
									label={t("UserName")}
									placeholder="your username"
									size="md"
									id="Username"
									classNames={{ input: classes.styledInput }}
									disabled={spinner}
									{...form.getInputProps("username")}
									onKeyDown={getHotkeyHandler([
										["Enter", () => document.getElementById("Password")?.focus()],
									])}
								/>
							</Tooltip>
						</Box>

						<Box className={classes.inputWrapper} mt="md">
							<Tooltip
								label={t("RequiredPassword")}
								px={20}
								py={3}
								opened={!!form.errors.password}
								position="top-end"
								color="red"
								withArrow
								offset={2}
								transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
							>
								<PasswordInput
									withAsterisk
									label={t("Password")}
									placeholder="ex. abc1234"
									size="md"
									classNames={{ input: classes.styledInput }}
									disabled={spinner}
									{...form.getInputProps("password")}
									id="Password"
									onKeyDown={getHotkeyHandler([
										["Enter", () => document.getElementById("LoginSubmit")?.click()],
									])}
								/>
							</Tooltip>
						</Box>
						<Button
							fullWidth
							mt="lg"
							bg="var(--theme-primary-color-6)"
							size="md"
							type="submit"
							id="LoginSubmit"
							className={`${LoginPage.control} ${classes.loginButton}`}
							rightSection={<IconLogin />}
							c="#eaeaea"
							disabled={spinner}
						>
							{spinner ? <Loader color="white" type="dots" size={30} /> : "Login"}
						</Button>
						<Flex
							justify="flex-end"
							align="center"
							gap="4xs"
							mt="xs"
							className={classes.resetLinks}
						>
							<Text
								className="cursor-pointer"
								fz="sm"
								fw={400}
								c="var(--theme-tertiary-color-6)"
								onClick={openResetModal}
							>
								Reset local data?
							</Text>
							<Text className="cursor-pointer" fz="sm" fw={400} c="red.6" onClick={openResetModal}>
								Reset now
							</Text>
						</Flex>
					</Paper>
				</Stack>
			</Box>
			<Box className={classes.wrapperImage}>
				<img
					style={{ width: "100%", height: "100vh", objectFit: "cover", objectPosition: "top" }}
					src={`./${COVER_IMAGE}`}
					alt={APP_NAME}
				/>
			</Box>
		</Box>
	);
}
