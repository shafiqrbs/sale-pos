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
	invoice_date: null,
	expected_date: null,
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
			invoice_date: (value) => {
				if (!value) {
					return t("InvoiceDateRequired");
				}
				return null;
			},
			expected_date: (value) => {
				if (!value) {
					return t("ExpectedDateRequired");
				}
				return null;
			},
		},
	};
};

const invoiceItemFormInitialValues = {
	barcode: "",
	productId: "",
	purchasePrice: "",
	quantity: "",
	unit: "",
	expired_date: "",
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
			purchasePrice: (value) => {
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
