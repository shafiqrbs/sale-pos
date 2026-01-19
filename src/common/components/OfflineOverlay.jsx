import { Box, LoadingOverlay } from "@mantine/core";
import { IconWifiOff } from "@tabler/icons-react";
import { useOutletContext } from "react-router";

export default function OfflineOverlay() {
	const { isOnline } = useOutletContext();

	return (
		<LoadingOverlay
			visible={!isOnline}
			loaderProps={{
				children: (
					<Box
						style={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							borderRadius: "50%",
							border: "1px solid rgb(216, 216, 216)",
							padding: "15px",
						}}
					>
						<IconWifiOff stroke={1.5} size={70} color="rgb(92, 92, 92)" />
					</Box>
				),
			}}
			overlayProps={{ radius: "sm", blur: 1 }}
		/>
	);
}
