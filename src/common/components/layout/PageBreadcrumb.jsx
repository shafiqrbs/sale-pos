// import { useLocation, useNavigate } from "react-router";
// import { useTranslation } from "react-i18next";
// import { IconArrowLeft } from "@tabler/icons-react";
import classes from "@assets/css/PageBreadcrumb.module.css";
import { Box, Text } from "@mantine/core";

export default function PageBreadcrumb({ label = "empty", h = 36 }) {
	// const { t } = useTranslation();
	// const location = useLocation();
	// const navigate = useNavigate();

	// const canGoBack = showBack && location.key !== "default";

	return (
		<Box h={h} className={classes.breadcrumb}>
			<Box className={classes.accent} />
			{/*{canGoBack && (
				<ActionIcon
					type="button"
					className={classes.backBtn}
					onClick={() => navigate(-1)}
					aria-label={t("Back")}
					size="sm"
				>
					<IconArrowLeft size={14} stroke={2.5} />
				</ActionIcon>
			)}*/}
			<Text component="span" className={classes.label}>
				{label}
			</Text>
			<Box className={classes.shine} />
		</Box>
	);
}
