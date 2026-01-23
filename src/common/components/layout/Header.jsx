import {
	Group,
	Button,
	UnstyledButton,
	Text,
	Box,
	Image,
	ActionIcon,
	Tooltip,
	Kbd,
	Menu,
	Modal,
	Flex,
	Grid,
	Select,
	TextInput,
} from "@mantine/core";

import { useDisclosure, useFullscreen } from "@mantine/hooks";
import {
	IconChevronDown,
	IconLogout,
	IconSearch,
	IconWindowMaximize,
	IconWindowMinimize,
	IconWifiOff,
	IconWifi,
	IconRefresh,
	IconPrinter,
	IconDashboard,
	IconMoneybag,
	IconStack,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";
import LanguagePickerStyle from "@assets/css/LanguagePicker.module.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
// import Sandra_Logo from "@assets/images/sandra_logo.jpeg";
import { CHARACTER_SET, LANGUAGES, LINE_CHARACTER } from "@/constants";
import SyncDrawer from "@components/modals/SyncDrawer.jsx";
import { APP_NAVLINKS } from "@/routes/routes.js";
import useConfigData from "@hooks/useConfigData";

export default function Header({ isOnline, toggleNetwork }) {
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	const [ openedPrinter, { open: openPrinter, close: closePrinter } ] = useDisclosure(false);
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { toggle, fullscreen } = useFullscreen();
	const [ syncPanelOpen, setSyncPanelOpen ] = useState(false);
	const [ languageOpened, setLanguageOpened ] = useState(false);
	const [ languageSelected, setLanguageSelected ] = useState(
		LANGUAGES.find((item) => item.value === i18n.language)
	);
	const [ printerSetup, setPrinterSetup ] = useState({
		printerName: "",
		characterSet: "PC437_USA",
		lineCharacter: "-",
	});

	const modalLinks = [
		{ label: "Dashboard", icon: <IconDashboard size={18} />, action: () => { } },
		{ label: "Sales", icon: <IconMoneybag size={18} />, action: () => { } },
		{ label: "Stock", icon: <IconStack size={18} />, action: () => { } },
	]

	useEffect(() => {
		const checkPrinterData = async () => {
			const storedPrinterData = await window.dbAPI.getDataFromTable("printer");
			if (storedPrinterData) {
				setPrinterSetup({
					printerName: storedPrinterData.printer_name || "",
					characterSet: storedPrinterData.character_set || "PC437_USA",
					lineCharacter: storedPrinterData.line_character || "-",
				});
			}
		};

		if (openedPrinter) {
			checkPrinterData();
		}
	}, [ openedPrinter ]);

	async function logout() {
		await window.dbAPI.destroyTableData();
		navigate(APP_NAVLINKS.LOGIN, { replace: true });
	}

	function toggleSyncPanel() {
		setSyncPanelOpen(!syncPanelOpen);
	}

	const handlePrinterSetup = async (e) => {
		e.preventDefault();
		try {
			await window.dbAPI.upsertIntoTable("printer", {
				id: 1,
				printer_name: printerSetup.printerName,
				line_character: printerSetup.lineCharacter,
				character_set: printerSetup.characterSet,
			});
			closePrinter();
		} catch (error) {
			console.error("Error in handlePrinterSetup:", error);
		}
	};

	return (
		<>
			<Box bg="var(--theme-primary-color-6)" mb={"2"} pos={`relative`}>
				<Flex align="center" justify="space-between">
					<Flex gap="sm">
						<Box
							c={"white"}
							fw={"800"}
							className="cursor-pointer"
							onClick={() => navigate("/")}
							pl="lg"
						>
							{configData?.domain?.company_name}
						</Box>
						<Flex ml="60px" gap="lg" align="center">
							{modalLinks.map((link) => (
								<Flex className="cursor-pointer" onClick={link.action} c="white" key={link.label} align="center" gap="les">
									{link.icon}
									<Text size="sm">{link.label}</Text>
								</Flex>
							))}
						</Flex>
					</Flex>

					<Flex
						gap="sm"
						justify="flex-end"
						direction="row"
						wrap="wrap"
						mih={42}
						align={"right"}
						px={`xs`}
						pr={"24"}
					>
						<Menu
							onOpen={() => setLanguageOpened(true)}
							onClose={() => setLanguageOpened(false)}
							radius="md"
							width="target"
							withinPortal
							withArrow
							arrowPosition="center"
						>
							<Tooltip label="Sync Data" bg={`red.5`} withArrow>
								<ActionIcon
									disabled={!isOnline}
									mt={"4xs"}
									onClick={toggleSyncPanel}
									variant="filled"
									color={`white`}
									bg={isOnline ? "green.8" : "gray.1"}
								>
									<IconRefresh size={20} />
								</ActionIcon>
							</Tooltip>
							<Tooltip label="Pos printer setup" bg={`red.5`} withArrow>
								<ActionIcon
									mt={"4xs"}
									onClick={openPrinter}
									variant="transparent"
									color={`white`}
								>
									<IconPrinter size={20} />
								</ActionIcon>
							</Tooltip>
							<Menu.Target>
								<UnstyledButton
									p={2}
									className={LanguagePickerStyle.control}
									data-expanded={languageOpened || undefined}
								>
									<Group gap="xs">
										<Image
											styles={{ root: { width: "auto" } }}
											src={languageSelected?.flag}
											width={18}
											height={18}
										/>
										<span className={LanguagePickerStyle.label}>
											{languageSelected?.label}
										</span>
									</Group>
									<IconChevronDown
										size="1rem"
										className={LanguagePickerStyle.icon}
										stroke={1}
									/>
								</UnstyledButton>
							</Menu.Target>
							<Menu.Dropdown p={4} className={LanguagePickerStyle.dropdown}>
								{LANGUAGES.map((item) => (
									<Menu.Item
										p={4}
										leftSection={
											<Image src={item.flag} width={18} height={18} />
										}
										onClick={() => {
											setLanguageSelected(item);
											i18n.changeLanguage(item.value);
										}}
										key={item.label}
									>
										{item.label}
									</Menu.Item>
								))}
							</Menu.Dropdown>
						</Menu>
						<Tooltip
							label={fullscreen ? t("NormalScreen") : t("Fullscreen")}
							bg={`red.5`}
							withArrow
						>
							<ActionIcon
								mt={"4xs"}
								onClick={toggle}
								variant="subtle"
								color={`white`}
							>
								{fullscreen ? (
									<IconWindowMinimize size={24} />
								) : (
									<IconWindowMaximize size={24} />
								)}
							</ActionIcon>
						</Tooltip>
						<Tooltip label={t("Logout")} bg={`red.5`} withArrow position={"left"}>
							<ActionIcon
								onClick={() => logout()}
								variant="subtle"
								mt={"4xs"}
								color={`white`}
							>
								<IconLogout size={24} />
							</ActionIcon>
						</Tooltip>
						<Tooltip
							label={isOnline ? t("Online") : t("Offline")}
							bg={isOnline ? "var(--theme-secondary-color-6)" : "red.5"}
							withArrow
						>
							<ActionIcon
								mt={"4xs"}
								variant="filled"
								radius="xl"
								color={isOnline ? "var(--theme-secondary-color-6)" : "red.5"}
								onClick={toggleNetwork}
							>
								{isOnline ? (
									<IconWifi color={"white"} size={24} />
								) : (
									<IconWifiOff color={"white"} size={24} />
								)}
							</ActionIcon>
						</Tooltip>
					</Flex>
				</Flex>
			</Box>

			{/* ---------- printer modal ------- */}
			<Modal opened={openedPrinter} onClose={closePrinter} title="Setup Printer">
				<form onSubmit={handlePrinterSetup}>
					<TextInput
						mb={10}
						required
						label={t("Printer Name")}
						value={printerSetup.printerName}
						onChange={(e) =>
							setPrinterSetup({
								...printerSetup,
								printerName: e.target.value,
							})
						}
						placeholder="RT378"
						description="Same as printer name and printer sharing name"
					/>
					<Select
						mb={10}
						required
						label={t("Character Set")}
						value={printerSetup.characterSet}
						onChange={(e) =>
							setPrinterSetup({
								...printerSetup,
								characterSet: e,
							})
						}
						data={CHARACTER_SET}
						placeholder="PC437_USA"
					/>
					<Select
						mb={10}
						required
						label={t("Line Character")}
						value={printerSetup.lineCharacter}
						onChange={(e) =>
							setPrinterSetup({
								...printerSetup,
								lineCharacter: e,
							})
						}
						description="How the lines separator will build"
						data={LINE_CHARACTER}
						placeholder="="
					/>
					<Button type="submit" fullWidth bg={"red.5"}>
						{t("Save Settings")}
					</Button>
				</form>
			</Modal>
			{/* ----------- sync information ----------- */}
			<SyncDrawer syncPanelOpen={syncPanelOpen} setSyncPanelOpen={setSyncPanelOpen} />
		</>
	);
}
