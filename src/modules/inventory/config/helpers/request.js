const purchaseInitialValues = {
	search_by_vendor: 0,
	search_by_product_nature: 0,
	search_by_category: 0,
	is_barcode: 0,
	is_measurement_enable: 0,
	is_purchase_auto_approved: 0,
};

export const getPurchaseFormData = () => {
	return {
		initialValues: purchaseInitialValues,
	};
};
