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

export const vendorOverviewRequest = () => {
	return {
		initialValues: vendorOverviewInitialValues,
		validate: {
			transactionModeId: (value) => {
				if (!value) {
					return "Transaction mode is required";
				}
				return null;
			},
			vendor_id: (value) => {
				if (!value) {
					return "Vendor is required";
				}
				return null;
			},
			invoice_date: (value) => {
				if (!value) {
					return "Invoice date is required";
				}
				return null;
			},
			expected_date: (value) => {
				if (!value) {
					return "Expected date is required";
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

export const invoiceItemFormRequest = () => {
	return {
		initialValues: invoiceItemFormInitialValues,
		validate: {
			productId: (value) => {
				if (!value) {
					return "Product is required";
				}
				return null;
			},
			purchasePrice: (value) => {
				if (!value) {
					return "Purchase price is required";
				}
				return null;
			},
			quantity: (value) => {
				if (!value) {
					return "Quantity is required";
				}
				return null;
			},
		},
	};
};
