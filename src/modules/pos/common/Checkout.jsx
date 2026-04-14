// import useGetInvoiceDetails from '@hooks/useGetInvoiceDetails';
import { Box, Group, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import CheckoutTable from "./CheckoutTable";
import { useTranslation } from "react-i18next";
import useConfigData from "@hooks/useConfigData";
import { IconSum } from "@tabler/icons-react";
import Transaction from "./Transaction";
import useCartOperation from "@hooks/useCartOperation";
import useLoggedInUser from "@hooks/useLoggedInUser";
import { formatCurrency } from "@utils/index";

export default function Checkout() {
	const { t } = useTranslation();

	const { user } = useLoggedInUser();
	const { currencySymbol } = useConfigData();
	const { invoiceData, getCartTotal } = useCartOperation();

	const editingSale = useSelector((state) => state.checkout.editingSale);
	const customerId = invoiceData?.customer_id;

	const form = useForm({
		initialValues: {
			customer_id: "",
			sales_by_id: "",
			receive_amount: null,
			discount_type: "flat",
			discount: 0,
			coupon_code: "",
			payments: [],
			split_payment_drawer_opened: false,
		},
		validate: {
			payments: (value) => {
				return !value || value.length === 0 ? true : null;
			},
			receive_amount: (value) => {
				return !value || value === "" ? true : null;
			},
			sales_by_id: (value) => (!value ? true : null),
			customer_id: () => {
				return !customerId ? true : null;
			},
		},
	});

	useEffect(() => {
		if (user) {
			form.setFieldValue("sales_by_id", user?.id?.toString());
		}
	}, [user]);

	// =============== restore form values when editing a sale ================
	useEffect(() => {
		if (editingSale) {
			if (editingSale.salesById) {
				form.setFieldValue("sales_by_id", editingSale.salesById?.toString());
			}
			if (editingSale.discount) {
				form.setFieldValue("discount", editingSale.discount);
			}
			if (editingSale.discount_type) {
				form.setFieldValue("discount_type", editingSale.discount_type);
			}
			if (editingSale.payments) {
				const payments = typeof editingSale.payments === "string"
					? JSON.parse(editingSale.payments)
					: editingSale.payments;
				if (payments?.length) {
					form.setFieldValue("payments", payments);
				}
			}
			if (editingSale.customerId) {
				form.setFieldValue("customer_id", editingSale.customerId?.toString());
			}
		}
	}, [editingSale]);

	return (
		<Box pr="3xs">
			<CheckoutTable />

			<Group
				h={34}
				justify="space-between"
				align="center"
				pt={0}
				bg="gray.4"
				style={{
					borderTop: "2px solid var(--mantine-color-gray-4)",
				}}
			>
				<Text fw="bold" fz="sm" c="black" pl="2xs">
					{t("SubTotal")}
				</Text>
				<Group gap="2xs" pr="sm" align="center">
					<IconSum size="16" style={{ color: "inherit" }} />
					<Text fw="bold" fz="sm" c="black">
						{currencySymbol} {formatCurrency(getCartTotal())}
					</Text>
				</Group>
			</Group>

			<Transaction form={form} />
		</Box>
	);
}
