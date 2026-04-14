import { useEffect, useRef, useState } from "react";
import { Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useSelector, useDispatch } from "react-redux";

import InvoiceForm from "./form/InvoiceForm";
import SalesOverview from "./Overview";
import { salesOverviewRequest } from "./helpers/request";
import { showNotification } from "@components/ShowNotificationComponent";
import useTempSalesProducts from "@hooks/useTempSalesProducts";
import useLoggedInUser from "@hooks/useLoggedInUser";
import useConfigData from "@hooks/useConfigData";
import { useAddSalesMutation } from "@services/sales";
import { generateInvoiceId, formatDateTime, formatDateISO } from "@utils/index";
import { useTranslation } from "react-i18next";
import { useOutletContext, useNavigate } from "react-router";
import { clearEditingSale } from "@features/checkout";
import { APP_NAVLINKS } from "@/routes/routes";

export default function NewIndex() {
	const { t } = useTranslation();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { user } = useLoggedInUser();
	const { isOnline } = useOutletContext();
	const { configData, is_sales_online } = useConfigData();
	const [ addSales ] = useAddSalesMutation();
	const shouldSubmitSalesOnline = isOnline && is_sales_online;
	const itemsForm = useForm(salesOverviewRequest(t));
	const { salesProducts: itemsProducts, refetch } = useTempSalesProducts({ type: "sales" });
	const [ resetKey, setResetKey ] = useState(0);
	const [ isAddingItem, setIsAddingItem ] = useState(false);

	const editingSale = useSelector((state) => state.checkout.editingSale);
	const isEditMode = !!editingSale;

	// =============== tracks whether the submit was triggered via POS Print ===============
	const withPosPrintRef = useRef(false);

	// =============== restore form values from editingSale (hold sale resumption) ===============
	useEffect(() => {
		if (editingSale) {
			if (editingSale.customerId) {
				itemsForm.setFieldValue("customer_id", editingSale.customerId?.toString());
			}
			if (editingSale.discount) {
				itemsForm.setFieldValue("discount", editingSale.discount);
			}
			if (editingSale.discount_type) {
				itemsForm.setFieldValue("discount_type", editingSale.discount_type);
			}
			if (editingSale.payments) {
				const payments = typeof editingSale.payments === "string"
					? JSON.parse(editingSale.payments)
					: editingSale.payments;
				if (payments?.length) {
					itemsForm.setFieldValue("payments", payments);
					const totalAmount = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
					itemsForm.setFieldValue("paymentAmount", totalAmount);
				}
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ editingSale ]);

	// =============== update product quantities and sales after successful sale (same as POS Transaction) ===============
	const updateProductsAfterSale = async () => {
		try {
			for (const cartItem of itemsProducts) {
				const productId = cartItem.product_id;
				const currentProduct = await window.dbAPI.getDataFromTable("core_products", {
					id: productId,
				});
				const currentProductData = Array.isArray(currentProduct)
					? currentProduct[ 0 ]
					: currentProduct;

				if (!currentProductData) {
					console.error(`Product not found in database: ${productId}`);
					continue;
				}

				const soldQuantity = Number(cartItem.quantity) || 0;
				const newQuantity = (currentProductData.quantity || 0) - soldQuantity;
				const newTotalSales = (currentProductData.total_sales || 0) + soldQuantity;

				await window.dbAPI.updateDataInTable("core_products", {
					condition: { id: productId },
					data: {
						quantity: newQuantity,
						total_sales: newTotalSales,
					},
				});
			}
			window.dispatchEvent(new CustomEvent("products-updated"));
		} catch (error) {
			console.error("Error updating products after sale:", error);
		}
	};
	const handleSubmit = async (formValues) => {
		if (!itemsProducts?.length) {
			showNotification(t("AddMinimumOneSalesItemFirst"), "red");
			return;
		}

		const payments = formValues.payments ?? [];
		if (!payments.length) {
			showNotification(t("TransactionModeRequired"), "red");
			return;
		}

		if (Number(formValues.paymentAmount) < 0) {
			showNotification(t("PaymentAmountRequired"), "red");
			return;
		}

		const subTotal = itemsProducts.reduce(
			(sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
			0
		);

		const discountValue =
			formValues.discount_type === "coupon" ? 0 : Number(formValues.discount) || 0;

		const vat = 0;
		const grandTotal = Math.max(subTotal - discountValue + vat, 0);
		const fullAmount = Number(formValues.paymentAmount) || 0;
		const isSplitPaymentActive = payments.length > 1;
		const modeName = isSplitPaymentActive ? "Multiple" : (payments[ 0 ]?.transaction_mode_name ?? "");

		// =============== get customer info from database ===============
		let customerName = "";
		let customerMobile = "";
		let customerAddress = "";
		if (formValues.customer_id) {
			const customers = await window.dbAPI.getDataFromTable("core_customers", {
				id: formValues.customer_id,
			});
			const customerData = Array.isArray(customers) ? customers[ 0 ] : customers;
			if (customerData) {
				customerName = customerData.name ?? "";
				customerMobile = customerData.mobile ?? "";
				customerAddress = customerData.address ?? "";
			}
		}

		const invoiceId = generateInvoiceId();
		const salesItemsForDb = itemsProducts.map((item) => ({
			product_id: item.product_id,
			display_name: item.display_name,
			quantity: Number(item.quantity) || 0,
			mrp: Number(item.mrp ?? item.price ?? item.sales_price) || 0,
			sales_price: Number(item.sales_price) || 0,
			sub_total: (Number(item.quantity) || 0) * (Number(item.sales_price) || 0),
			category_id: item.category_id ?? null,
			category_name: item.category_name ?? "",
		}));

		const discountTypeLabel =
			formValues.discount_type === "flat"
				? "Flat"
				: formValues.discount_type === "percentage"
					? "Percentage"
					: "Coupon";

		const salesData = {
			invoice: invoiceId,
			sub_total: subTotal,
			total: Math.round(grandTotal),
			approved_by_id: user?.id ?? null,
			payment: fullAmount,
			discount: discountValue,
			discount_calculation: discountValue,
			discount_type: discountTypeLabel,
			customerId: formValues.customer_id ?? null,
			customerName,
			customerMobile,
			customer_address: customerAddress,
			createdByUser: user?.username ?? "",
			createdById: user?.id ?? null,
			salesById: user?.id ?? null,
			salesByUser: user?.username ?? "",
			salesByName: user?.name ?? "",
			process: "approved",
			mode_name: modeName,
			created: formatDateTime(new Date()),
			sales_items: JSON.stringify(salesItemsForDb),
			multi_transaction: isSplitPaymentActive ? 1 : 0,
			payments: JSON.stringify(payments),
			status: formValues.status || "completed",
		};

		const primaryTransactionModeId = payments[ 0 ]?.transaction_mode_id;

		const buildSalesApiPayload = () => ({
			customer_id: String(formValues.customer_id ?? ""),
			sub_total: subTotal,
			transaction_mode_id: String(primaryTransactionModeId ?? ""),
			discount_type: discountTypeLabel,
			discount: discountValue,
			discount_calculation: 0,
			vat,
			total: Math.round(grandTotal),
			sales_by_id: String(user?.id ?? ""),
			created_by_id: Number(user?.id) || 0,
			process: "",
			narration: formValues.salesNarration ?? "",
			invoice_date: formatDateISO(formValues.salesDate ?? new Date()),
			items: itemsProducts.map((item) => ({
				product_id: item.product_id,
				item_name: item.display_name ?? "",
				sales_price: Number(item.sales_price) || 0,
				price: Number(item.price ?? item.sales_price) || 0,
				percent: item.percent ? String(item.percent) : "",
				quantity: Number(item.quantity) || 0,
				price_matrix_id: null,
				measurement_unit_id: null,
				measurement_unit_quantity: null,
				measurement_unit_name: null,
				measurement_string: null,
				uom: item.unit_name ?? "",
				unit_id: item.unit_id ?? null,
				purchase_price: Number(item.purchase_price) || 0,
				sub_total: Number(item.sub_total) || 0,
				warehouse_id: item.warehouse_id ?? null,
				purchase_item_id: null,
				bonus_quantity: Number(item.bonus_quantity) || 0,
			})),
			payment: fullAmount,
		});

		setIsAddingItem(true);
		try {
			if (editingSale) {
				// =============== update mode: update existing hold sale record ===============
				if (editingSale.id) {
					await window.dbAPI.updateDataInTable("sales", {
						condition: { id: editingSale.id },
						data: salesData,
					});
				}
				dispatch(clearEditingSale());
			} else if (shouldSubmitSalesOnline) {
				const salesResponse = await addSales(buildSalesApiPayload()).unwrap();
				if (salesResponse.data?.error) {
					showNotification(salesResponse.data.error || "Failed to save sale", "red");
					return;
				}
			} else {
				await window.dbAPI.upsertIntoTable("sales", salesData);
			}
			await updateProductsAfterSale();

			const shouldPrint = withPosPrintRef.current;

			showNotification(editingSale ? t("SaleUpdatedSuccessfully") : t("SaleAddedSuccessfully"), "teal");

			await window.dbAPI.deleteDataFromTable("temp_sales_products", { type: "sales" });
			refetch();
			itemsForm.reset();
			setResetKey((previousKey) => previousKey + 1);

			if (shouldPrint && window.deviceAPI?.thermalPrint) {
				const setup = await window.dbAPI.getDataFromTable("printer");
				if (setup?.printer_name) {
					await window.deviceAPI.thermalPrint({
						configData: { ...configData, user },
						salesItems: salesItemsForDb,
						salesViewData: salesData,
						setup,
					});
				} else {
					showNotification(t("PrinterNotSetup"), "red");
				}
			}

			// =============== after editing, navigate back to sales list ===============
			if (isEditMode) {
				navigate(APP_NAVLINKS.SALES);
				return;
			}
		} catch (error) {
			console.error(error);
			showNotification(error?.message || error?.data?.error || "Failed to save sale", "red");
		} finally {
			setIsAddingItem(false);
			withPosPrintRef.current = false;
		}
	};

	const handlePosPrint = () => {
		withPosPrintRef.current = true;
		// =============== trigger itemsForm submission with POS print flag set ===============
		itemsForm.onSubmit(handleSubmit)();
	};

	const handleReset = async () => {
		await window.dbAPI.deleteDataFromTable("temp_sales_products", { type: "sales" });
		refetch();
		itemsForm.reset();
		setResetKey((previousKey) => previousKey + 1);
	};

	return (
		<Box>
			<Box p="xs" pb={0}>
				<InvoiceForm refetch={refetch} />
			</Box>
			<Box component="form" id="itemsForm" onSubmit={itemsForm.onSubmit(handleSubmit)}>
				<SalesOverview
					isAddingItem={isAddingItem}
					itemsForm={itemsForm}
					itemsProducts={itemsProducts}
					refetch={refetch}
					onPosPrint={handlePosPrint}
					onReset={handleReset}
					resetKey={resetKey}
					handleSubmit={handleSubmit}
					isEditMode={isEditMode}
				/>
			</Box>
		</Box>
	);
}
