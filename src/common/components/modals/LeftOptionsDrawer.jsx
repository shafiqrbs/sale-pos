import { Accordion, Stack, UnstyledButton, Text, Group, Divider } from "@mantine/core";
import { useNavigate, useLocation } from "react-router";
import {
	IconSettings,
	IconUsers,
	IconTruck,
	IconShoppingCart,
	IconReceipt,
	IconArrowBack,
	IconPackage,
	IconBox,
} from "@tabler/icons-react";
import GlobalDrawer from "./GlobalDrawer";
import { APP_NAVLINKS } from "@/routes/routes";

const DRAWER_MENU = [
	{
		value: "core",
		label: "Core",
		icon: IconSettings,
		submenu: [
			{ label: "Manage customers", pathname: APP_NAVLINKS.CUSTOMERS, icon: IconUsers },
			{ label: "Manage vendors", pathname: "/core/vendor", icon: IconTruck },
		],
	},
	{
		value: "sales-purchases",
		label: "Sales & Purchases",
		icon: IconShoppingCart,
		submenu: [
			{ label: "Sales", pathname: "/inventory/sales", icon: IconReceipt },
			{ label: "Purchase", pathname: "/inventory/purchase", icon: IconShoppingCart },
			{ label: "Sales return", pathname: "/inventory/sales-return", icon: IconArrowBack },
			{ label: "New purchase", pathname: "/inventory/new-purchase", icon: IconPackage },
			{ label: "Opening stock", pathname: "/inventory/opening-stock", icon: IconBox },
		],
	},
];

export default function LeftOptionsDrawer({ opened, onClose }) {
	const navigate = useNavigate();
	const location = useLocation();

	const handleSubmenuClick = (pathname) => {
		navigate(pathname);
		onClose();
	};

	return (
		<GlobalDrawer
			opened={opened}
			onClose={onClose}
			title="Options"
			position="left"
			size="330px"
		>
			<Divider mb="md" />
			<Accordion variant="filled" defaultValue="core">
				{DRAWER_MENU.map((menuItem) => {
					const MainIcon = menuItem.icon;
					return (
						<Accordion.Item key={menuItem.value} value={menuItem.value}>
							<Accordion.Control icon={<MainIcon size={18} />}>
								{menuItem.label}
							</Accordion.Control>
							<Accordion.Panel>
								<Stack gap="xs">
									<Divider />
									{menuItem.submenu.map((subItem) => {
										const SubIcon = subItem.icon;
										const isActive =
											location.pathname === subItem.pathname ||
											location.pathname.startsWith(`${subItem.pathname}/`);
										return (
											<UnstyledButton
												key={subItem.pathname}
												onClick={() => handleSubmenuClick(subItem.pathname)}
												style={{
													padding: "var(--mantine-spacing-sm)",
													borderRadius: "var(--mantine-radius-sm)",
													backgroundColor: isActive
														? "var(--mantine-color-default-hover)"
														: "transparent",
												}}
											>
												<Group gap="sm">
													<SubIcon size={18} stroke={1.5} />
													<Text size="sm" fw={isActive ? 600 : 400}>
														{subItem.label}
													</Text>
												</Group>
											</UnstyledButton>
										);
									})}
								</Stack>
							</Accordion.Panel>
						</Accordion.Item>
					);
				})}
			</Accordion>
		</GlobalDrawer>
	);
}
