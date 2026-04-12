const salesOverviewInitialValues = {
	customer_id: "",
	customerName: "",
	customerMobile: "",
	salesDate: new Date(),
	salesNarration: "",
	// =============== discount fields matching POS Transaction (flat | percentage | coupon) ===============
	discount_type: "flat",
	discount: 0,
	coupon_code: "",
	paymentAmount: 0,
	// =============== payments array supports both single and split payment modes ===============
	payments: [],
	splitPaymentDrawerOpened: false,
	_grandTotal: 0,
};

export const salesOverviewRequest = (t) => {
	return {
		initialValues: salesOverviewInitialValues,
		validate: {
			payments: (value) => {
				if (!value?.length) {
					return t("TransactionModeRequired");
				}
				return null;
			},
			paymentAmount: (value, values) => {
				const amount = Number(value) || 0;
				const grandTotal = Number(values._grandTotal) || 0;
				if (amount <= 0) {
					return t("PaymentAmountRequired");
				}
				if (!values.customer_id && grandTotal > 0 && amount < grandTotal) {
					return t("ExactAmountRequiredWithoutCustomer");
				}
				return null;
			},
		},
	};
};

const salesItemFormInitialValues = {
	barcode: "",
	productId: "",
	salesPrice: "",
	quantity: 1,
	unit: "",
	discount: 0,
};

export const salesItemFormRequest = (t) => {
	return {
		initialValues: salesItemFormInitialValues,
		validate: {
			productId: (value) => {
				if (!value) {
					return t("ProductRequired");
				}
				return null;
			},
			salesPrice: (value) => {
				if (!value) {
					return t("SalesPriceRequired");
				}
				return null;
			},
			quantity: (value) => {
				if (!value) {
					return t("QuantityRequired");
				}
				return null;
			},
		},
	};
};
