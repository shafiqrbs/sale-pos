import { notifications } from "@mantine/notifications";
import { rem } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

export const showNotification = (
	title,
	color,
	backgroundColor,
	icon = <IconCheck style={{ width: rem(18), height: rem(18) }} />,
	message = null,
	loading = false,
	autoClose = 2000,
	autoCloseButton = true
) => {
	notifications.show({
		color: color,
		title: title,
		message: message,
		icon,
		loading: loading,
		autoClose: autoClose,
		style: { backgroundColor },
		withCloseButton: autoCloseButton,
	});
};
