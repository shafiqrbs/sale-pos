import { useState } from "react";
import { Box, Grid, Stack, Text, Group, Loader, Center } from "@mantine/core";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { IconBox, IconEditCircle, IconPhoto, IconRulerMeasure } from "@tabler/icons-react";
import { useGetProductByIdQuery } from "@services/product";
import UpdateProductTab from "./form/UpdateProductTab.jsx";
import SkuManagementTab from "./form/SkuManagementTab.jsx";
import ImageGallery from "./form/ImageGallery.jsx";
import ProductMeasurementTab from "./form/ProductMeasurementTab.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";

const TABS = {
	UPDATE: "update",
	SKU: "sku",
	MEASUREMENT: "measurement",
	GALLERY: "gallery",
};

export default function EditIndex() {
	const { t } = useTranslation();
	const { id: productId } = useParams();
	const [ activeTab, setActiveTab ] = useState(TABS.UPDATE);
	const { mainAreaHeight } = useMainAreaHeight();

	const {
		data: productResponse,
		isLoading,
		isFetching,
	} = useGetProductByIdQuery(productId, { skip: !productId });

	const product = productResponse?.data;

	const navItems = [
		{ key: TABS.UPDATE, label: t("UpdateProduct"), icon: IconEditCircle },
		{ key: TABS.SKU, label: t("SkuManagement"), icon: IconBox },
		{ key: TABS.MEASUREMENT, label: t("ProductMeasurement"), icon: IconRulerMeasure },
		{ key: TABS.GALLERY, label: t("ProductGallery"), icon: IconPhoto },
	];

	return (
		<Box p="xs" bg="var(--mantine-color-gray-2)">
			<Grid columns={12} gutter="xs" h="100%">
				<Grid.Col span={3}>
					<Box bg="white" className="borderRadiusAll" p="sm">
						<Text fw={600} mb="xs">
							{t("ProductNavigation")}
						</Text>
						<Box h={3} w={40} bg="var(--mantine-color-blue-5)" bdrs={2} mb={12} />
						<Stack gap={6} h={mainAreaHeight - 80}>
							{navItems.map((item) => {
								const Icon = item.icon;
								const isActive = activeTab === item.key;
								return (
									<Box
										key={item.key}
										onClick={() => setActiveTab(item.key)}
										px="sm"
										py="xs"
										className="cursor-pointer"
										bdrs={5}
										bg={isActive ? "var(--mantine-color-orange-1)" : "transparent"}
										color={isActive ? "var(--mantine-color-dark-8)" : "inherit"}
										fw={isActive ? 600 : 400}
									>
										<Group gap="sm" wrap="nowrap">
											<Icon size={18} stroke={1.5} />
											<Text size="sm">{item.label}</Text>
										</Group>
									</Box>
								);
							})}
						</Stack>
					</Box>
				</Grid.Col>

				<Grid.Col span={9}>
					<Box bg="white" className="borderRadiusAll" p="md" mih={400}>
						{isLoading || isFetching ? (
							<Center h={mainAreaHeight - 36}>
								<Loader size="sm" />
							</Center>
						) : !product ? (
							<Center h={mainAreaHeight - 36}>
								<Text c="dimmed">{t("NothingFound")}</Text>
							</Center>
						) : (
							<>
								{activeTab === TABS.UPDATE && (
									<UpdateProductTab product={product} productId={productId} />
								)}
								{activeTab === TABS.SKU && (
									<SkuManagementTab product={product} productId={productId} />
								)}
								{activeTab === TABS.MEASUREMENT && (
									<ProductMeasurementTab product={product} productId={productId} />
								)}
								{activeTab === TABS.GALLERY && (
									<ImageGallery product={product} productId={productId} />
								)}
							</>
						)}
					</Box>
				</Grid.Col>
			</Grid>
		</Box>
	);
}
