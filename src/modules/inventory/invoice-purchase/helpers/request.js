const vendorOverviewInitialValues = {
	vendor_id: "",
	vendorName: "",
	vendorPhone: "+880",
	vendorEmail: "",
	items: [],
	transactionMode: "cash",
	transactionModeId: "",
	purchaseDate: new Date(),
	purchaseNarration: "",
	discountAmount: 0,
	isDiscountPercentage: false,
	paymentAmount: 0,
	dueAmount: 0,
};

export const vendorOverviewRequest = (t) => {
	return {
		initialValues: vendorOverviewInitialValues,
		validate: {
			transactionModeId: (value) => {
				if (!value) {
					return t("TransactionModeRequired");
				}
				return null;
			},
			vendor_id: (value) => {
				if (!value) {
					return t("VendorRequired");
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

const invoiceItemFormInitialValues = {
	barcode: "",
	productId: "",
	measurement_quantity: 1,
	measurement: "",
	quantity: "",
	total_mrp: "",
	item_percent: "",
	purchase_price: "",
	bonus_quantity: "",
	expired_date: "",
	minimum_quantity: "",
	unit: "",
};

export const invoiceItemFormRequest = (t) => {
	return {
		initialValues: invoiceItemFormInitialValues,
		validate: {
			productId: (value) => {
				if (!value) {
					return t("ProductRequired");
				}
				return null;
			},
			purchase_price: (value) => {
				if (!value) {
					return t("PurchasePriceRequired");
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
