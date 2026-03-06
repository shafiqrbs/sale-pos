const salesOverviewInitialValues = {
	customer_id: "",
	customerName: "",
	customerMobile: "",
	salesDate: new Date(),
	salesNarration: "",
	discountAmount: 0,
	isDiscountPercentage: false,
	paymentAmount: 0,
	// =============== payments array supports both single and split payment modes ===============
	payments: [],
	splitPaymentDrawerOpened: false,
};

export const salesOverviewRequest = () => {
	return {
		initialValues: salesOverviewInitialValues,
		validate: {
			payments: (value) => {
				if (!value?.length) {
					return "Transaction mode is required";
				}
				return null;
			},
			paymentAmount: (value) => {
				if (Number(value) <= 0) {
					return "Payment amount is required";
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
};

export const salesItemFormRequest = () => {
	return {
		initialValues: salesItemFormInitialValues,
		validate: {
			productId: (value) => {
				if (!value) {
					return "Product is required";
				}
				return null;
			},
			salesPrice: (value) => {
				if (!value) {
					return "Sales price is required";
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
