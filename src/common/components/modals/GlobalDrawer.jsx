import React from "react";
import { Drawer, LoadingOverlay } from "@mantine/core";

export default function GlobalDrawer({
	loading = false,
	opened,
	onClose,
	children,
	position = "right",
	padding = "lg",
	size = "md",
	overlayProps = {
		backgroundOpacity: 0.55,
	},
	title,
	styles,
	...restProps
}) {
	return (
		<Drawer
			pos="relative"
			position={position}
			opened={opened}
			onClose={onClose}
			padding={padding}
			size={size}
			overlayProps={overlayProps}
			title={title}
			styles={styles}
			{...restProps}
		>
			<LoadingOverlay
				visible={loading}
				zIndex={1000}
				overlayProps={{ radius: "sm", blur: 2 }}
				loaderProps={{ color: "red.6" }}
			/>
			{children}
		</Drawer>
	);
}
