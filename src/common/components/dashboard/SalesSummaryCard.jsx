import { ActionIcon, Divider, Flex, Grid, Paper, ScrollArea, Text } from "@mantine/core";
import {
	IconArrowBackUp,
	IconCashRegister,
	IconDiscount,
	IconFileInvoice,
	IconPackages,
	IconReload,
	IconShoppingCart,
	IconSum,
	IconTrash,
	IconTruckDelivery,
	IconWallet,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import StatCard from "./StatCard";
import { formatCurrency } from "@utils/index";
import useConfigData from "@hooks/useConfigData";
import { useOutletContext } from "react-router";
import useLoggedInUser from "@hooks/useLoggedInUser";

const STAT_ITEMS = [
	{
		icon: IconWallet,
		labelKey: "OpeningBalance",
		valueKey: "totalOpeningBalance",
		format: "currency",
		color: "blue",
	},
	{
		icon: IconTruckDelivery,
		labelKey: "PurchaseReceive",
		valueKey: "totalPurchase",
		format: "currency",
		color: "green",
	},
	{
		icon: IconPackages,
		labelKey: "TotalStock",
		valueKey: "totalStock",
		format: "currency",
		color: "orange",
	},
	{
		icon: IconShoppingCart,
		labelKey: "TotalSales",
		valueKey: "totalSales",
		format: "currency",
		color: "grape",
	},
	{
		icon: IconDiscount,
		labelKey: "Discount",
		valueKey: "totalDiscount",
		format: "currency",
		color: "yellow",
	},
	{
		icon: IconSum,
		labelKey: "TotalSalesAfterDiscount",
		valueKey: "total",
		format: "currency",
		color: "indigo",
	},
	{
		icon: IconArrowBackUp,
		labelKey: "Return",
		valueKey: "return",
		format: "currency",
		color: "gray",
	},
	{
		icon: IconTrash,
		labelKey: "Wastage/Leftover",
		valueKey: "wastage",
		format: "currency",
		color: "red",

	},
	{
		icon: IconCashRegister,
		labelKey: "ClosingBalance",
		valueKey: "totalClosingBalance",
		format: "currency",
		color: "violet",
	},
	{
		icon: IconFileInvoice,
		labelKey: "TotalInvoices",
		valueKey: "totalInvoices",
		format: "currency",
		color: "teal",
	},
];

//console.log(dailyData)

export default function SalesSummaryCard({ dailyData, cardHeight, refetch }) {
	const { t } = useTranslation();
	const { currencySymbol } = useConfigData();
	const { isOnline } = useOutletContext();
	const { isOnlinePermissionIncludes } = useLoggedInUser();

	return (
		<Paper shadow="sm" p="lg" radius="md" withBorder h="100%">
			<Flex align="center" justify="space-between" mb="md">
				<Text size="lg" fw={700}>
					{t("Today's Stock & Sales Summary")}
				</Text>
				{isOnline && isOnlinePermissionIncludes && (
					<ActionIcon onClick={refetch}>
						<IconReload size={20} />
					</ActionIcon>
				)}
			</Flex>
			<Divider />
			<ScrollArea scrollbarSize={4} scrollbars="y" type="hover" h={cardHeight}>
				<Grid gutter="md" mt={"md"}>
					{STAT_ITEMS.map((item) => {
						const value =
							item.format === "currency"
								? `${currencySymbol} ${formatCurrency(dailyData[ item.valueKey ])}`
								: dailyData[ item.valueKey ];
						const IconComponent = item.icon;
						return (
							<Grid.Col key={item.labelKey} span={6}>
								<StatCard
									icon={<IconComponent size={32} />}
									label={t(item.labelKey)}
									value={value}
									color={item.color}
								/>
							</Grid.Col>
						);
					})}
				</Grid>
			</ScrollArea>
		</Paper>
	);
}
