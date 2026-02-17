import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	productSnapshots: {},
};

const cartSnapshotSlice = createSlice({
	name: "cartSnapshot",
	initialState,
	reducers: {
		// =============== add or update product snapshot ================
		addProductSnapshot(state, action) {
			const { stockItemId, product } = action.payload;
			if (!state.productSnapshots[ stockItemId ]) {
				state.productSnapshots[ stockItemId ] = {
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
			delete state.productSnapshots[ stockItemId ];
		},
		// =============== clear all product snapshots ================
		clearProductSnapshots(state) {
			state.productSnapshots = {};
		},
		// =============== get product snapshot by stock item id ================
		getProductSnapshot(state, action) {
			return state.productSnapshots[ action.payload ];
		},
	},
});

export const {
	addProductSnapshot,
	removeProductSnapshot,
	clearProductSnapshots,
	getProductSnapshot,
} = cartSnapshotSlice.actions;

export default cartSnapshotSlice.reducer;
