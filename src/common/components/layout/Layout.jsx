import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useViewportSize } from "@mantine/hooks";
import { AppShell, Center, Loader } from "@mantine/core";
import Header from "./Header";
import Footer from "./Footer";
import { useNetwork } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { APP_NAVLINKS } from "@/routes/routes";

const Layout = () => {
	const networkStatus = useNetwork();
	const [ isOnline, setIsOnline ] = useState(false);
	const { height } = useViewportSize();
	const location = useLocation();
	const paramPath = location.pathname;
	const [ isLoading, setIsLoading ] = useState(true);
	const [ activated, setActivated ] = useState({ is_activated: false });
	const [ user, setUser ] = useState({});

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

	const headerHeight = 42;
	const footerHeight = 58;
	const padding = 0;
	const mainAreaHeight = height - headerHeight - footerHeight - padding;

	return (
		<AppShell padding={padding}>
			<AppShell.Header height={headerHeight} bg="gray.0">
				<Header isOnline={isOnline} toggleNetwork={toggleNetwork} />
			</AppShell.Header>
			<AppShell.Main py="44px" h="calc(100vh - 90px)">
				<Outlet context={{ isOnline, toggleNetwork, mainAreaHeight, user }} />
			</AppShell.Main>
			<AppShell.Footer height={footerHeight}>
				<Footer />
			</AppShell.Footer>
		</AppShell>
	);
};

export default Layout;
