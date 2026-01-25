import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    invoiceData: [],
};

const checkoutSlice = createSlice({
    name: "checkout",
    initialState,
    reducers: {
        setInvoiceData(state, action) {
            state.invoiceData = action.payload;
        },
        clearCart(state) {
            state.invoiceData = [];
        },
    },
});

export const { setInvoiceData, clearCart } = checkoutSlice.actions;
export default checkoutSlice.reducer;
