import {
	Paper,
	TextInput,
	PasswordInput,
	Checkbox,
	Button,
	Title,
	Anchor,
	Alert,
	Tooltip,
	Group,
	Center,
	rem,
	Box,
	Loader,
	Flex,
	Text,
} from "@mantine/core";
import { modals } from "@mantine/modals";
import LoginPage from "@assets/css/LoginPage.module.css";
import classes from "@assets/css/AuthenticationImage.module.css";
import { getHotkeyHandler, useHotkeys } from "@mantine/hooks";
import { IconInfoCircle, IconLogin, IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { isNotEmpty, useForm } from "@mantine/form";
import { Navigate, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import orderProcessDropdownLocalDataStore from "@utils/local-storage/orderProcessDropdownLocalDataStore.js";
import commonDataStoreIntoLocalStorage from "@utils/local-storage/commonDataStoreIntoLocalStorage.js";
import { APP_NAVLINKS, MASTER_APIS } from "@/routes/routes";

export default function Login() {
	const [ user, setUser ] = useState(null);
	const [ loading, setLoading ] = useState(true);
	const { t } = useTranslation();
	const navigate = useNavigate();
	const icon = <IconInfoCircle />;

	const [ spinner, setSpinner ] = useState(false);
	const [ errorMessage, setErrorMessage ] = useState("");
	const [ activated, setActivated ] = useState({ is_activated: false });

	useEffect(() => {
		const checkAuth = async () => {
			try {
				const res = await window.dbAPI.getDataFromTable("users");
				setUser(res);
				if (res?.id) {
					navigate(APP_NAVLINKS.BAKERY, { replace: true });
				}
			} catch (error) {
				console.error("Auth check error:", error);
			} finally {
				setLoading(false);
			}
		};
		checkAuth();
	}, [ navigate ]);

	useEffect(() => {
		async function checkActivation() {
			const activationData = await window.dbAPI.getDataFromTable("license_activate");
			setActivated(activationData);
		}

		checkActivation();
	}, []);

	useHotkeys([ [ "alt+n", () => document.getElementById("Username")?.focus() ] ], []);

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
			const response = await axios({
				method: "POST",
				url: MASTER_APIS.LOGIN,
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"X-Api-Key": import.meta.env.VITE_API_KEY,
				},
				data,
			});

			if (response.data.status === 200) {
				window.dbAPI.upsertIntoTable("users", response.data.data);
				orderProcessDropdownLocalDataStore(response.data?.data?.id);

				await commonDataStoreIntoLocalStorage(response.data?.data?.id);
				navigate(APP_NAVLINKS.BAKERY, { replace: true });
			} else {
				setErrorMessage(response.data.message);
			}
		} catch (error) {
			setErrorMessage(error?.message || "Login failed");
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
					Are you sure you want to reset your local data? This action is destructive and
					you will lose all of your local data which aren&apos;t synced yet.
				</Text>
			),
			labels: { confirm: "Reset now", cancel: "No don't reset it" },
			confirmProps: { color: "red" },
			onCancel: () => console.info("Cancel"),
			onConfirm: async () => {
				await window.dbAPI.resetDatabase();
				navigate(APP_NAVLINKS.ACTIVATE);
			},
		});
	};

	return (
		<div className={classes.wrapper}>
			<Box component="form" onSubmit={form.onSubmit(login)}>
				<Paper className={classes.form} radius={0} p={30}>
					<Title order={2} className={classes.title} ta="center" mt="md" mb={80}>
						{t("WelcomeBackToPOSH")}
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
							placeholder={t("UserName")}
							size="md"
							id="Username"
							{...form.getInputProps("username")}
							onKeyDown={getHotkeyHandler([
								[ "Enter", () => document.getElementById("Password")?.focus() ],
							])}
						/>
					</Tooltip>

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
							placeholder={t("Password")}
							mt="md"
							size="md"
							{...form.getInputProps("password")}
							id="Password"
							onKeyDown={getHotkeyHandler([
								[ "Enter", () => document.getElementById("LoginSubmit")?.click() ],
							])}
						/>
					</Tooltip>
					<Checkbox label="Keep me logged in" mt="xl" size="md" />
					<Group justify="space-between" mt="lg" className={LoginPage.controls}>
						<Anchor c="dimmed" size="sm" className={LoginPage.control}>
							<Center inline>
								<IconArrowLeft
									style={{ width: rem(12), height: rem(12) }}
									stroke={1.5}
								/>
								<Box ml={5}>Back to the sign-up page</Box>
							</Center>
						</Anchor>
					</Group>
					<Flex gap="6px">
						<Button
							fullWidth
							mt="xl"
							bg="red.5"
							size="md"
							type="button"
							className={LoginPage.control}
							rightSection={<IconRefresh />}
							onClick={openResetModal}
						>
							Reset
						</Button>
						<Button
							fullWidth
							mt="xl"
							bg="var(--theme-primary-color-6)"
							size="md"
							type="submit"
							id="LoginSubmit"
							className={LoginPage.control}
							rightSection={<IconLogin />}
							disabled={spinner}
						>
							{spinner ? <Loader color="white" type="dots" size={30} /> : "Login"}
						</Button>

					</Flex>
				</Paper>
			</Box>
			<Box className={classes.wrapperImage} />
		</div>
	);
}
