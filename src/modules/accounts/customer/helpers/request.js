import { hasLength, isNotEmpty } from "@mantine/form";

const initialValues = {
    name: "",
    customer_group_id: "",
    credit_limit: "",
    reference_id: "",
    mobile: "",
    alternative_mobile: "",
    email: "",
    location_id: "",
    marketing_id: "",
    address: "",
    discount_percent: "",
}

export const customerRequest = (t) => {
    return {
        initialValues,
        validate: {
            name: hasLength({ min: 2, max: 20 }),
            customer_group_id: isNotEmpty(),
            mobile: (value) => {
                if (!value) return t("MobileValidationRequired");
            },
            email: (value) => {
                if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    return true;
                }
                return null;
            },
            credit_limit: (value) => {
                if (value) {
                    const isNumberOrFractional = /^-?\d+(\.\d+)?$/.test(value);
                    if (!isNumberOrFractional) {
                        return true;
                    }
                }
                return null;
            },
            discount_percent: (value) => {
                if (value) {
                    const validFormat = /^(?:[0-9]|[1-9][0-9])(\.\d{1,2})?$/.test(value);
                    if (!validFormat) {
                        return true;
                    }
                }
                return null;
            },
        }
    }
}