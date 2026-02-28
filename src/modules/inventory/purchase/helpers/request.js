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
};

export const vendorOverviewRequest = () => {
    return {
        initialValues: vendorOverviewInitialValues,
    };
};
