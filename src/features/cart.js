import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	cartItems: [],
	productSnapshots: {},
};

// =============== hold the initial state of the cart items ================
const cartSlice = createSlice({
	name: "cart",
	initialState,
	reducers: {
		getCartItems(state) {
			return state.cartItems;
		},
		getCartItemById(state, action) {
			return state.cartItems.find((item) => item.id === action.payload);
		},
		removeCartItemById(state, action) {
			state.cartItems = state.cartItems.filter((item) => item.id !== action.payload);
		},
		setCartItems(state, action) {
			state.cartItems = action.payload;
		},
		clearCartItems(state) {
			state.cartItems = [];
		},
		// =============== add or update product snapshot ================
		addProductSnapshot(state, action) {
			const { stockItemId, product } = action.payload;
			if (!state.productSnapshots[stockItemId]) {
				state.productSnapshots[stockItemId] = {
					quantity: product.quantity,
					total_sales: product.total_sales,
					purchase_item_for_sales: product.purchase_item_for_sales,
					sales_price: product.sales_price,
				};
			}
		},
		// =============== remove product snapshot ================
		removeProductSnapshot(state, action) {
			const stockItemId = action.payload;
			delete state.productSnapshots[stockItemId];
		},
		// =============== clear all product snapshots ================
		clearProductSnapshots(state) {
			state.productSnapshots = {};
		},
		// =============== get product snapshot by stock item id ================
		getProductSnapshot(state, action) {
			return state.productSnapshots[action.payload];
		},
	},
});

export const {
	setCartItems,
	clearCartItems,
	addProductSnapshot,
	removeProductSnapshot,
	clearProductSnapshots,
	getProductSnapshot,
} = cartSlice.actions;
export default cartSlice.reducer;
