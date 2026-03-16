import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    invoiceData: [],
    editingSale: null,
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
        setEditingSale(state, action) {
            state.editingSale = action.payload;
        },
        clearEditingSale(state) {
            state.editingSale = null;
        },
    },
});

export const { setCartData, clearCart, setEditingSale, clearEditingSale } = checkoutSlice.actions;
export default checkoutSlice.reducer;
