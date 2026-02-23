import { APP_NAVLINKS } from "@/routes/routes";
import { Box, Grid, Card, Text, ScrollArea, Button, Flex, Stack, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import ProductForm from "./form/ProductForm";
import SalesForm from "./form/SalesForm";
import PurchaseForm from "./form/PurchaseForm";
import useMainAreaHeight from "@hooks/useMainAreaHeight";
import { IconDeviceFloppy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import featuresCardsCss from "@assets/css/FeaturesCards.module.css";
import DetailsSection from "./_DetailsSection";
import useConfigData from "@hooks/useConfigData";

const NAV_ITEMS = ["Product", "Sales", "Purchase"];

const TABS_WITH_SAVE = [
	"Sales",
	"Domain",
	"Purchase",
	"Requisition",
	"Accounting",
	"Production",
	"Discount",
	"Product",
	"Inventory",
	"Pos",
	"Vat",
];

export default function ConfigIndex() {
	const { mainAreaHeight } = useMainAreaHeight();
	const [activeTab, setActiveTab] = useState("Purchase");
	const { isOnline } = useOutletContext();
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { configData } = useConfigData();
	const height = mainAreaHeight - 86;

	useEffect(() => {
		if (!isOnline) {
			navigate(APP_NAVLINKS.BAKERY);
		}
	}, [isOnline, navigate]);

	const renderForm = () => {
		switch (activeTab) {
			case "Product":
				return <ProductForm />;
			case "Sales":
				return <SalesForm />;
			case "Purchase":
				return <PurchaseForm height={height} />;
			default:
				return null;
		}
	};

	return (
		<Box p="xs" bg="var(--theme-grey-color-0)">
			<Grid columns={24} gutter={{ base: 8 }}>
				<Grid.Col span={4}>
					<Card shadow="md" radius="4" className={featuresCardsCss.card} padding="xs">
						<Grid gutter={{ base: 2 }}>
							<Grid.Col span={11}>
								<Text fz="md" fw={500} className={featuresCardsCss.cardTitle}>
									{t("ConfigNavigation")}
								</Text>
							</Grid.Col>
						</Grid>
						<Grid columns={9} gutter={{ base: 1 }}>
							<Grid.Col span={9}>
								<Box bg="white">
									<Box mt="8" pt="8">
										<ScrollArea h={height} scrollbarSize={2} scrollbars="y" type="never">
											{NAV_ITEMS.map((item) => (
												<Box
													key={item}
													style={{
														borderRadius: 4,
														cursor: "pointer",
													}}
													className={`${featuresCardsCss["pressable-card"]} border-radius`}
													mih={40}
													mt="4"
													variant="default"
													onClick={() => setActiveTab(item)}
													bg={activeTab === item ? "#f8eedf" : "gray.1"}
												>
													<Text size="sm" pt="8" pl="8" fw={500} c="black">
														{t(item)}
													</Text>
												</Box>
											))}
										</ScrollArea>
									</Box>
								</Box>
							</Grid.Col>
						</Grid>
					</Card>
				</Grid.Col>
				<Grid.Col span={11}>
					<Box bg="white" p="xs" className="borderRadiusAll" mb="8">
						<Box bg="white">
							<Box
								pl="xs"
								pr={8}
								pt="8"
								pb="10"
								mb="4"
								className="boxBackground borderRadiusAll"
								bg="gray.1"
							>
								<Grid>
									<Grid.Col span={6}>
										<Title order={6} pt="4">
											{t(activeTab)}
										</Title>
									</Grid.Col>
									<Grid.Col span={6}>
										<Stack justify="flex-end" align="flex-end">
											{TABS_WITH_SAVE.includes(activeTab) && (
												<Button
													size="xs"
													className="btnPrimaryBg"
													leftSection={<IconDeviceFloppy size={16} />}
													onClick={() => {
														const submitButtonId = `${activeTab}FormSubmit`;
														document.getElementById(submitButtonId)?.click();
													}}
												>
													<Flex direction="column" gap={0}>
														<Text fz={14} fw={400}>
															{t("UpdateAndSave")}
														</Text>
													</Flex>
												</Button>
											)}
										</Stack>
									</Grid.Col>
								</Grid>
							</Box>
							<Box px="xs" className="borderRadiusAll">
								{renderForm()}
							</Box>
						</Box>
					</Box>
				</Grid.Col>
				<Grid.Col span={9}>
					<DetailsSection height={height} data={configData} />
				</Grid.Col>
			</Grid>
		</Box>
	);
}
