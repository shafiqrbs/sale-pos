import { Box, Group, Flex, ActionIcon, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import classes from "@assets/css/FooterNavbar.module.css";
import { useNavigate } from "react-router";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { useState, useEffect } from "react";

function Footer() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [ zoomLevel, setZoomLevel ] = useState(() => {
		const initialZoom = window.zoomAPI.getZoomFactor();
		return Math.round(initialZoom * 100);
	});

	const links = [
		{ link: "/inventory/sales-invoice", label: t("Sales") },
		{ link: "/inventory/purchase-invoice", label: t("Purchase") },
		{ link: "/inventory/product", label: t("Product") },
		{ link: "/accounting/voucher-entry", label: t("Accounting") },
	];

	function zoomIn() {
		const currentFactor = window.zoomAPI.getZoomFactor();
		const newFactor = Math.min(currentFactor + 0.1, 2.0);
		window.zoomAPI.setZoomFactor(newFactor);
		setZoomLevel(Math.round(newFactor * 100));
	}

	function zoomOut() {
		const currentFactor = window.zoomAPI.getZoomFactor();
		const newFactor = Math.max(currentFactor - 0.1, 0.5);
		window.zoomAPI.setZoomFactor(newFactor);
		setZoomLevel(Math.round(newFactor * 100));
	}

	const handleKeyDown = (event) => {
		if (event.ctrlKey) {
			if (event.key === "+" || event.key === "=") {
				event.preventDefault();
				zoomIn();
			} else if (event.key === "-") {
				event.preventDefault();
				zoomOut();
			}
		}
	};

	useEffect(() => {
		window.zoomAPI.onZoomChange((zoomFactor) => {
			setZoomLevel(Math.round(zoomFactor * 100));
		});

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const items = links.map((link) => (
		<a
			key={link.label}
			href={link.link}
			className={classes.link}
			onClick={(event) => {
				event.preventDefault();
				navigate(link.link);
			}}
		>
			{link.label}
		</a>
	));

	const leftLinks = [
		{ link: "/", label: t("Home") },
		{ link: "/sitemap", label: t("Sitemap") },
	];

	const leftItems = leftLinks.map((link) => (
		<a
			key={link.label}
			href={link.link}
			className={classes.link}
			onClick={(event) => {
				event.preventDefault();
				navigate(link.link);
			}}
		>
			{link.label}
		</a>
	));

	return (
		<Box p="0">
			<footer className={classes.footer}>
				<div className={classes.inner}>
					<Group gap={5} className={classes.links} visibleFrom="sm">
						<Flex
							gap="md"
							mih={42}
							justify="flex-start"
							align="center"
							direction="row"
							wrap="wrap"
						>
							{leftItems}
						</Flex>
					</Group>
					<Group>
						<Group ml={50} gap={5} className={classes.links} visibleFrom="sm">
							<Flex
								gap="md"
								mih={42}
								justify="flex-start"
								align="center"
								direction="row"
								wrap="wrap"
							>
								{items}
							</Flex>
						</Group>
						<Group>
							<ActionIcon variant="outline" onClick={zoomOut} size="sm">
								<IconMinus style={{ width: "70%", height: "70%" }} />
							</ActionIcon>
							<Text size="sm">{zoomLevel}%</Text>
							<ActionIcon variant="outline" onClick={zoomIn} size="sm">
								<IconPlus style={{ width: "70%", height: "70%" }} />
							</ActionIcon>
						</Group>
					</Group>
				</div>
			</footer>
		</Box>
	);
}
export default Footer;
