export const formatDate = (date) => {
	const formattedDate = new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(date);
	const formattedDateWithDash = formattedDate.replace(/\//g, "-");
	return formattedDateWithDash; // 13-04-2025
};

export const formatDateTime = (date) => {
	const formattedDate = new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(date);
	const formattedDateWithDash = formattedDate.replace(/\//g, "-");
	return formattedDateWithDash; // 13-04-2025 12:00 PM
};

export const generateInvoiceId = () => {
	return Date.now().toString().slice(1, 13);
};

export const applyDiscount = (price, discount) => {
	return price - (price * discount) / 100;
};

export const applyZakat = (price, zakat) => {
	return price * zakat;
};

export const applyAIT = (price, ait) => {
	return price * ait;
};

export const applyCoupon = (price, coupon) => {
	return price - (price * coupon) / 100;
};

// =============== vat calculation utility function ================
export const calculateVATPrice = (price, vatConfig) => {
	if (!vatConfig?.vat_enable) return price;

	if (vatConfig?.vat_mode?.toLowerCase() === "including") {
		// If VAT is already included, return the price as is
		return price;
	} else if (vatConfig?.vat_mode?.toLowerCase() === "excluding") {
		// If VAT is excluded, add VAT percentage
		const vatAmount = price * (vatConfig.vat_percent / 100);
		return price + vatAmount;
	}

	return price;
};

// =============== calculate subtotal with vat ================
export const calculateSubTotalWithVAT = (price, quantity, vatConfig) => {
	const vatPrice = calculateVATPrice(price, vatConfig);
	return vatPrice * quantity;
};

export const calculateVATAmount = (vatPrice, vatConfig) => {
	if (vatConfig?.vat_mode?.toLowerCase() === "excluding") {
		// =============== calculate base price first by removing vat ================
		const basePrice = vatPrice / (1 + vatConfig.vat_percent / 100);
		// =============== then calculate vat amount from base price ================
		const vatAmount = basePrice * (vatConfig.vat_percent / 100);
		return vatAmount?.toFixed(2);
	}

	return vatPrice?.toFixed(2);
};
