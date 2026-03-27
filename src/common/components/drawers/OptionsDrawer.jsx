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
	IconBasket,
	IconBasketDown,
	IconGardenCart,
	IconTruckReturn,
	IconReceiptTax,
	IconTruckLoading,
	IconTruckDelivery, IconStack3, IconStackPop,
} from "@tabler/icons-react";
import GlobalDrawer from "./GlobalDrawer";
import { APP_NAVLINKS } from "@/routes/routes";
import useLoggedInUser from "@hooks/useLoggedInUser";
import classes from '@assets/css/Accrodion.module.css';
import useConfigData from "@hooks/useConfigData";


const DRAWER_MENU = [

	{
		value: "sales",
		label: "Sales",
		icon: IconShoppingCart,
		submenu: [
			{ label: "Sales", pathname: APP_NAVLINKS.SALES, icon: IconGardenCart },
			{ label: "New Sale", pathname: APP_NAVLINKS.SALES_NEW, icon: IconReceipt },
			{ label: "Sales Return", pathname: APP_NAVLINKS.SALES_RETURN, icon: IconBasketDown },
			{ label: "New Sales Return", pathname: APP_NAVLINKS.SALES_RETURN_NEW, icon: IconReceiptTax },
		],
	},
	{
		value: "purchases",
		label: "Purchases",
		icon: IconTruck,
		submenu: [
			{ label: "Purchase", pathname: APP_NAVLINKS.PURCHASE, icon: IconTruckLoading },
			{ label: "New purchase", pathname: APP_NAVLINKS.PURCHASE_NEW, icon: IconPackage },
			{ label: "Purchase Item", pathname: APP_NAVLINKS.PURCHASE_ITEMS, icon: IconPackage },
			{ label: "Purchase Return", pathname: APP_NAVLINKS.PURCHASE_RETURN, icon: IconTruckReturn },
			{ label: "New Purchase Return", pathname: APP_NAVLINKS.PURCHASE_RETURN_NEW, icon: IconReceiptTax },
		],
	},
	{
		value: "requisition",
		label: "Requisition",
		icon: IconTruckDelivery,
		submenu: [
			{ label: "Requisition", pathname: APP_NAVLINKS.REQUISITION, icon: IconTruckLoading },
			{ label: "New Requisition", pathname: APP_NAVLINKS.REQUISITION_NEW, icon: IconReceiptTax },
		],
	},
	{
		value: "stock",
		label: "Stocks",
		icon: IconStack3,
		submenu: [
			{ label: "Stocks", pathname: APP_NAVLINKS.STOCK, icon: IconStackPop },
		],
	},
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
		value: "report",
		label: "Report",
		icon: IconSettings,
		submenu: [
			{ label: "Category Summary", pathname: APP_NAVLINKS.CATEGORY_SUMMARY, icon: IconUsers },
		],
	},
];

export default function OptionsDrawer({ isOnline,opened, onClose }) {
	const navigate = useNavigate();
	const location = useLocation();
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	const handleSubmenuClick = (pathname) => {
		navigate(pathname);
		onClose();
	};

	return (
		<GlobalDrawer
			opened={opened}
			onClose={onClose}
			title={configData?.domain?.company_name || configData?.company_name}
			position="right"
			size="380px"
		>
			<Divider mb="md"  />
			<Accordion variant="filled" defaultValue="core" classNames={classes}  maw={400} transitionDuration={1000}>
				{DRAWER_MENU.map((menuItem) => {
					const MainIcon = menuItem.icon;
					return (
						<Accordion.Item key={menuItem.value} value={menuItem.value}>
							<Accordion.Control fz={'sm'} fw='600' c="var(--theme-primary-color-9)" icon={<MainIcon size={18} />}>
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
													borderBottom:"1px solid #f9fafb",
													paddingTop:'6px',
													paddingBottom:'6px',
													paddingLeft:'12px',
													backgroundColor: isActive
														? "var(--mantine-color-default-hover)"
														: "transparent",
												}}
											>
												<Group gap="sm">
													<SubIcon size={18} stroke={1.5} />
													<Text size="xs" fw={isActive ? 600 : 400}>
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
