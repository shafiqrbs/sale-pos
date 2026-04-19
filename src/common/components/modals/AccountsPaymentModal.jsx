import { rem } from "@mantine/core";
import GlobalModal from "./GlobalModal";

export default function AccountsPaymentModal({ opened, onClose, title, children }) {
	return (
		<GlobalModal
			opened={opened}
			onClose={onClose}
			title={title}
			size="lg"
			styles={{
				title: { fontWeight: 600, fontSize: rem(18), color: "var(--mantine-color-dark-7)" },
			}}
		>
			{children}
		</GlobalModal>
	);
}
