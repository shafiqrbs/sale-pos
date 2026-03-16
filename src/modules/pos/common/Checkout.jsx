// import useGetInvoiceDetails from '@hooks/useGetInvoiceDetails';
import { Box, Group, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import React, { useEffect } from "react";
import { useOutletContext } from "react-router";
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
	const { isOnline } = useOutletContext();
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	const { invoiceData, getCartTotal } = useCartOperation();

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
		const editingSale = localStorage.getItem("editing_sale");
		if (editingSale) {
			try {
				const saleData = JSON.parse(editingSale);
				if (saleData.salesById) {
					form.setFieldValue("sales_by_id", saleData.salesById?.toString());
				}
				if (saleData.discount) {
					form.setFieldValue("discount", saleData.discount);
				}
				if (saleData.discount_type) {
					form.setFieldValue("discount_type", saleData.discount_type);
				}
				if (saleData.payments) {
					const payments = typeof saleData.payments === "string"
						? JSON.parse(saleData.payments)
						: saleData.payments;
					if (payments?.length) {
						form.setFieldValue("payments", payments);
					}
				}
				if (saleData.customerId) {
					form.setFieldValue("customer_id", saleData.customerId?.toString());
				}
			} catch (err) {
				console.error("Error restoring editing sale data:", err);
			}
		}
	}, []);

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
						{configData?.inventory_config?.currency?.symbol} {formatCurrency(getCartTotal())}
					</Text>
				</Group>
			</Group>

			<Transaction form={form} />
		</Box>
	);
}
