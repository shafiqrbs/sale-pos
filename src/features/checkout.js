import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    invoiceData: [],
};

const checkoutSlice = createSlice({
    name: "checkout",
    initialState,
    reducers: {
        setCartData(state, action) {
            state.invoiceData = action.payload;
        },
        clearCart(state) {
            state.invoiceData = [];
        },
    },
});

export const { setCartData, clearCart } = checkoutSlice.actions;
export default checkoutSlice.reducer;
