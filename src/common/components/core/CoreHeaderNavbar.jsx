import { Group, Menu, rem, ActionIcon, Text, Box, Flex } from "@mantine/core";
import { useTranslation } from "react-i18next";
import {
	IconInfoCircle,
	IconSettings,
	IconAdjustments,
	IconMap2,
	IconLetterMSmall,
} from "@tabler/icons-react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { APP_NAVLINKS } from "@/routes/routes";

export default function CoreHeaderNavbar({ pageTitle }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();

	const links = [
		{ link: APP_NAVLINKS.CUSTOMERS, label: t("Customers") },
		{ link: "/core/vendor", label: t("Vendors") },
		{ link: "/core/user", label: t("Users") },
	];

	const items = links.map((link) => (
		<NavLink
			key={link.label}
			to={link.link}
			style={{ textDecoration: "none" }}
			className={location.pathname === link.link ? "navbar-link-active" : ""}
		>
			<Text size="sm" c="black">
				{link.label}
			</Text>
		</NavLink>
	));

	return (
		<Box component="header" mb="xs" py="4px" px="xs" className="border-all-radius" bg="#f9fbf1">
			<Flex align="center" justify="space-between">
				<Text>{pageTitle}</Text>

				<Flex gap="sm" align="center">
					<Flex gap="xl" mr="30px" align="center">
						{items}
					</Flex>
					<Menu withArrow arrowPosition="center" trigger="hover" openDelay={100} closeDelay={400}>
						<Menu.Target>
							<ActionIcon variant="filled" color="red.5" radius="xl" aria-label="Settings">
								<IconInfoCircle height="12" width="12" stroke={1.5} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								component="button"
								onClick={() => navigate("/core/setting")}
								leftSection={<IconAdjustments style={{ width: rem(14), height: rem(14) }} />}
							>
								{t("Setting")}
							</Menu.Item>
							<Menu.Item
								component="button"
								onClick={() => navigate("/core/warehouse")}
								leftSection={<IconMap2 style={{ width: rem(14), height: rem(14) }} />}
							>
								{t("Warehouse")}
							</Menu.Item>
							<Menu.Item
								component="button"
								onClick={() => navigate("/core/marketing-executive")}
								leftSection={<IconLetterMSmall style={{ width: rem(14), height: rem(14) }} />}
							>
								{t("MarketingExecutive")}
							</Menu.Item>
							<Menu.Item
								href="/inventory/config"
								component="button"
								onClick={() => navigate("/inventory/config")}
								leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
							>
								{t("Configuration")}
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Flex>
			</Flex>
		</Box>
	);
}
