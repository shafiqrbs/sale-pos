import { useState } from "react";
import { Box, Button, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { IconReceipt, IconTruck, IconUser } from "@tabler/icons-react";
import AccountsPaymentModal from "@components/modals/AccountsPaymentModal";
import CustomerPaymentForm from "@modules/accounts/customer/form/Form";
import ExpensePaymentForm from "@modules/accounts/expense/form/ExpensePaymentForm";
import VendorPaymentForm from "@modules/accounts/vendor/form/VendorPaymentForm";

const ACCOUNTS_MODAL_VARIANT = {
	CUSTOMER: "customer",
	EXPENSE: "expense",
	VENDOR: "vendor",
};

export default function AccountsIndex() {
	const { t } = useTranslation();
	const [ accountsModalOpened, { open: openAccountsModal, close: closeAccountsModal } ] =
		useDisclosure(false);
	const [ accountsModalVariant, setAccountsModalVariant ] = useState(null);
	const [ accountsFormKey, setAccountsFormKey ] = useState(0);

	const openAccountsPaymentModal = (variant) => {
		setAccountsFormKey((previous) => previous + 1);
		setAccountsModalVariant(variant);
		openAccountsModal();
	};

	const accountsModalTitle =
		accountsModalVariant === ACCOUNTS_MODAL_VARIANT.CUSTOMER
			? t("CustomerPaymentReceive")
			: accountsModalVariant === ACCOUNTS_MODAL_VARIANT.EXPENSE
				? t("ExpensePayment")
				: accountsModalVariant === ACCOUNTS_MODAL_VARIANT.VENDOR
					? t("VendorPayment")
					: "";

	return (
		<Box p="md" bg="var(--mantine-color-gray-1)" mih="100%">
			<Group gap="sm" mb="md">
				<Button
					leftSection={<IconUser size={18} />}
					color="blue"
					variant="filled"
					onClick={() => openAccountsPaymentModal(ACCOUNTS_MODAL_VARIANT.CUSTOMER)}
				>
					{t("Customer")}
				</Button>
				<Button
					leftSection={<IconReceipt size={18} />}
					color="orange"
					variant="filled"
					onClick={() => openAccountsPaymentModal(ACCOUNTS_MODAL_VARIANT.EXPENSE)}
				>
					{t("Expense")}
				</Button>
				<Button
					leftSection={<IconTruck size={18} />}
					color="teal"
					variant="filled"
					onClick={() => openAccountsPaymentModal(ACCOUNTS_MODAL_VARIANT.VENDOR)}
				>
					{t("Vendor")}
				</Button>
			</Group>

			<AccountsPaymentModal
				opened={accountsModalOpened}
				onClose={closeAccountsModal}
				title={accountsModalTitle}
			>
				{accountsModalVariant === ACCOUNTS_MODAL_VARIANT.CUSTOMER && (
					<CustomerPaymentForm
						key={accountsFormKey}
						mode="create"
						onSuccess={closeAccountsModal}
						resetKey={accountsFormKey}
					/>
				)}
				{accountsModalVariant === ACCOUNTS_MODAL_VARIANT.EXPENSE && (
					<ExpensePaymentForm key={accountsFormKey} />
				)}
				{accountsModalVariant === ACCOUNTS_MODAL_VARIANT.VENDOR && (
					<VendorPaymentForm key={accountsFormKey} />
				)}
			</AccountsPaymentModal>
		</Box>
	);
}
