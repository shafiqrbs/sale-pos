import React from "react";
import { Modal, LoadingOverlay } from "@mantine/core";

export default function GlobalModal({
	loading = false,
	opened,
	onClose,
	children,
	padding = "lg",
	size = "lg",
	overlayProps = {
		backgroundOpacity: 0.55,
	},
	title,
	styles,
	centered = true,
	...restProps
}) {
	return (
		<Modal
			pos="relative"
			opened={opened}
			onClose={onClose}
			padding={padding}
			size={size}
			overlayProps={overlayProps}
			title={title}
			styles={styles}
			centered={centered}
			h="100%"
			{...restProps}
		>
			<LoadingOverlay
				visible={loading}
				zIndex={1000}
				overlayProps={{ radius: "sm", blur: 2 }}
				loaderProps={{ color: "red.6" }}
			/>
			{children}
		</Modal>
	);
}
