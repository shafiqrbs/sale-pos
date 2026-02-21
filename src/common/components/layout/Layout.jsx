import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { AppShell, Box, Center, Loader, ActionIcon, Tooltip } from "@mantine/core";
import { IconMenu2 } from "@tabler/icons-react";
import Header from "./Header";
import Footer from "./Footer";
import { useNetwork } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { APP_NAVLINKS } from "@/routes/routes";
import LeftOptionsDrawer from "@components/drawers/LeftOptionsDrawer";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { SHOW_PROGRESSIVE_WORKS } from "@constants/index";

export default function Layout() {
	const { mainAreaHeight, headerHeight, footerHeight, padding } = useMainAreaHeight();
	const networkStatus = useNetwork();
	const [ isOnline, setIsOnline ] = useLocalStorage({
		key: "network-preference",
		defaultValue: false,
	});
	const location = useLocation();
	const paramPath = location.pathname;
	const [ isLoading, setIsLoading ] = useState(true);
	const [ activated, setActivated ] = useState({ is_activated: false });
	const [ user, setUser ] = useState({});
	const [ leftDrawerOpened, { open: openLeftDrawer, close: closeLeftDrawer } ] = useDisclosure(false);

	useEffect(() => {
		const initializeData = async () => {
			try {
				const [ activationData, user ] = await Promise.all([
					window.dbAPI.getDataFromTable("license_activate"),
					window.dbAPI.getDataFromTable("users"),
				]);

				setActivated(activationData);
				setUser(user);
			} catch (error) {
				console.error("Error initializing data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		initializeData();
	}, []);

	useEffect(() => {
		if (!networkStatus.online && isOnline) {
			setIsOnline(false);
		}
	}, [ networkStatus.online ]);

	const toggleNetwork = () => {
		if (!networkStatus.online) {
			notifications.show({
				title: "Network Status",
				message: "⚠️ No internet connection, check your connection",
				color: "red",
				autoClose: 3000,
			});
			return setIsOnline(false);
		}

		notifications.show({
			title: "Network Status",
			message: !isOnline ? "Internet connection is restored" : "App is now in offline mode",
			color: !isOnline ? "teal" : "red",
			autoClose: 3000,
		});
		setIsOnline((prev) => !prev);
	};

	if (isLoading) {
		return (
			<Center h="100vh">
				<Loader size="lg" />
			</Center>
		);
	}

	if (!activated?.is_activated) {
		return <Navigate replace to={APP_NAVLINKS.ACTIVATE} />;
	}

	if (!user?.id) {
		return <Navigate replace to={APP_NAVLINKS.LOGIN} />;
	}

	if (paramPath === "/") {
		return <Navigate replace to={APP_NAVLINKS.BAKERY} />;
	}

	return (
		<AppShell padding={padding}>
			<AppShell.Header height={headerHeight} bg="gray.0">
				<Header isOnline={isOnline} toggleNetwork={toggleNetwork} />
			</AppShell.Header>
			<AppShell.Main bg="gray.0" py="44px" h="calc(100vh - 90px)">
				{isOnline && !leftDrawerOpened && SHOW_PROGRESSIVE_WORKS && (
					<Box
						pos="fixed"
						left={0}
						top="50%"
						style={{ transform: "translateY(-50%)", zIndex: 1000 }}
					>
						<Tooltip label="Options" position="right">
							<ActionIcon
								id="left-options-drawer-button"
								variant="filled"
								size="lg"
								opacity={leftDrawerOpened ? 1 : 0.5}
								radius="md"
								style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
								onClick={openLeftDrawer}
								aria-label="Open options menu"
							>
								<IconMenu2 size={20} />
							</ActionIcon>
						</Tooltip>
					</Box>
				)}
				<Outlet context={{ isOnline, toggleNetwork, mainAreaHeight, user }} />
			</AppShell.Main>
			<AppShell.Footer height={footerHeight}>
				<Footer />
			</AppShell.Footer>
			<LeftOptionsDrawer opened={leftDrawerOpened} onClose={closeLeftDrawer} />
		</AppShell>
	);
}
