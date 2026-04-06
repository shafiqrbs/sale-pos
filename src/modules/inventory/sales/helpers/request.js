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
			paymentAmount: (value) => {
				if (Number(value) <= 0) {
					return t("PaymentAmountRequired");
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
	quantity: "",
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
