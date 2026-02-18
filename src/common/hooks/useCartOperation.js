import { showNotification } from "@components/ShowNotificationComponent";
import useConfigData from "./useConfigData";
import { calculateSubTotalWithVAT, withInvoiceId } from "@utils/index";
// import { useInlineUpdateMutation } from "@services/pos";
import { useOutletContext } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setCartData } from "@features/checkout";
import { useEffect, useCallback } from "react";

export default function useCartOperation(tableId = null) {
	const invoiceData = useSelector((state) => state.checkout.invoiceData);
	const dispatch = useDispatch();
	const { isOnline } = useOutletContext();
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	// const [inlineUpdate] = useInlineUpdateMutation();

	const refetchInvoice = useCallback(async () => {
		const data = await window.dbAPI.getDataFromTable("invoice_table_item");
		dispatch(setCartData(data));
	}, [ dispatch ]);

	useEffect(() => {
		refetchInvoice();
	}, [ refetchInvoice ]);


	const increment = async (product, selectedBatches = null, isUpdate = false) => {
		const vatConfig = configData?.inventory_config?.config_vat;

		try {
			// =============== store product snapshot ================

			// if (isOnline) {
			//     const payload = {
			//         ...withInvoiceId(tableId),
			//         field_name: "items",
			//         value: { ...product, quantity: 1 },
			//     };

			//     const res = await inlineUpdate(payload).unwrap();
			//     if (res?.status !== 200) {
			//         showNotification(res?.message || "Error updating invoice", "red", "", "", true);
			//     }
			//     return;
			// }

			const itemCondition = {
				stock_item_id: product.stock_item_id || product.stock_id,
				...withInvoiceId(tableId),
			};

			const [ items, invoiceTable ] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : Promise.resolve(null),
			]);

			let deltaSubTotal = 0;
			let totalQuantityToAdd = 1;

			// =============== calculate total quantity from selected batches ================
			if (selectedBatches && Array.isArray(selectedBatches)) {
				totalQuantityToAdd = selectedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
			}

			if (items?.length) {
				// const oldQuantity = items[ 0 ].quantity;
				const updatedQuantity = isUpdate
					? totalQuantityToAdd
					: items[ 0 ].quantity + totalQuantityToAdd;

				const updatedSubTotal = calculateSubTotalWithVAT(
					product.sales_price,
					updatedQuantity,
					vatConfig
				);

				deltaSubTotal = updatedSubTotal - items[ 0 ].sub_total;

				// =============== handle batches ================
				let updatedBatches = [];

				if (isUpdate) {
					updatedBatches = selectedBatches || [];
				} else {
					// =============== add mode: merge batches ================
					let existingBatches = [];
					try {
						existingBatches =
							typeof items[ 0 ].batches === "string"
								? JSON.parse(items[ 0 ].batches)
								: Array.isArray(items[ 0 ].batches)
									? items[ 0 ].batches
									: [];
					} catch {
						existingBatches = [];
					}

					updatedBatches = [ ...existingBatches ];

					if (selectedBatches && Array.isArray(selectedBatches)) {
						selectedBatches.forEach((newBatch) => {
							const existingBatchIndex = updatedBatches.findIndex(
								(batch) => batch.id === newBatch.id
							);
							if (existingBatchIndex !== -1) {
								updatedBatches[ existingBatchIndex ].quantity += newBatch.quantity;
							} else {
								updatedBatches.push(newBatch);
							}
						});
					}
				}

				await window.dbAPI.updateDataInTable("invoice_table_item", {
					condition: itemCondition,
					data: {
						...itemCondition,
						quantity: updatedQuantity,
						purchase_price: product.purchase_price,
						sales_price: product.sales_price,
						sub_total: updatedSubTotal,
						display_name: product.display_name,
						batches: JSON.stringify(updatedBatches),
					},
				});
			} else {
				const subTotal = calculateSubTotalWithVAT(
					product.sales_price,
					totalQuantityToAdd,
					vatConfig
				);
				deltaSubTotal = subTotal;

				// =============== prepare batches for new item ================
				const batchesData =
					selectedBatches && Array.isArray(selectedBatches)
						? JSON.stringify(selectedBatches)
						: JSON.stringify([]);

				await window.dbAPI.upsertIntoTable("invoice_table_item", {
					stock_item_id: product.stock_item_id || product.stock_id,
					quantity: totalQuantityToAdd,
					quantity_limit: product.quantity,
					purchase_price: 0,
					sales_price: product.sales_price,
					custom_price: 0,
					is_print: 0,
					sub_total: subTotal,
					display_name: product.display_name,
					batches: batchesData,
					...withInvoiceId(tableId),
				});
			}

			if (tableId && invoiceTable) {
				await window.dbAPI.updateDataInTable("invoice_table", {
					id: tableId,
					data: { sub_total: invoiceTable.sub_total + deltaSubTotal },
				});
			}

			refetchInvoice();
		} catch (error) {
			showNotification("Request failed. Please try again.", "red", "", "", true);
			console.error(error);
		}
	};

	const decrement = async (product) => {
		const vatConfig = configData?.inventory_config?.config_vat;

		try {
			// if (isOnline) {
			//     const payload = {
			//         ...withInvoiceId(tableId),
			//         field_name: "items",
			//         value: { ...product, quantity: -1 },
			//     };

			//     const res = await inlineUpdate(payload).unwrap();
			//     if (res?.status !== 200) {
			//         showNotification(res?.message || "Error updating invoice", "red", "", "", true);
			//     }
			//     return;
			// }

			const itemCondition = {
				stock_item_id: product.stock_item_id || product.stock_id,
				...withInvoiceId(tableId),
			};

			const [ items, invoiceTable ] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : Promise.resolve(null),
			]);

			if (!items?.length || items[ 0 ].quantity <= 1) return;

			const updatedQuantity = items[ 0 ].quantity - 1;
			const updatedSubTotal = calculateSubTotalWithVAT(
				product.sales_price,
				updatedQuantity,
				vatConfig
			);

			const deltaSubTotal = updatedSubTotal - items[ 0 ].sub_total;

			// =============== handle batch decrement ================
			let existingBatches = [];
			try {
				existingBatches =
					typeof items[ 0 ].batches === "string"
						? JSON.parse(items[ 0 ].batches)
						: Array.isArray(items[ 0 ].batches)
							? items[ 0 ].batches
							: [];
			} catch {
				existingBatches = [];
			}

			// =============== decrement from the last batch ================
			if (existingBatches.length > 0) {
				for (let index = existingBatches.length - 1; index >= 0; index--) {
					if (existingBatches[ index ].quantity > 0) {
						existingBatches[ index ].quantity -= 1;
						if (existingBatches[ index ].quantity === 0) {
							existingBatches.splice(index, 1);
						}
						break;
					}
				}
			}

			await window.dbAPI.updateDataInTable("invoice_table_item", {
				condition: itemCondition,
				data: {
					...itemCondition,
					quantity: updatedQuantity,
					purchase_price: product.purchase_price,
					sales_price: product.sales_price,
					sub_total: updatedSubTotal,
					display_name: product.display_name,
					batches: JSON.stringify(existingBatches),
				},
			});

			if (tableId && invoiceTable) {
				await window.dbAPI.updateDataInTable("invoice_table", {
					id: tableId,
					data: { sub_total: invoiceTable.sub_total + deltaSubTotal },
				});
			}

			refetchInvoice();
		} catch (error) {
			showNotification("Request failed. Please try again.", "red", "", "", true);
			console.error(error);
		}
	};

	const remove = async (product) => {
		try {
			// if (isOnline) {
			//     const payload = {
			//         ...withInvoiceId(tableId),
			//         field_name: "items",
			//         value: [],
			//     };

			//     const res = await inlineUpdate(payload).unwrap();
			//     if (res?.status !== 200) {
			//         showNotification(res?.message || "Error updating invoice", "red", "", "", true);
			//     }
			//     refetchInvoice();
			//     return;
			// }

			const itemCondition = {
				stock_item_id: product.stock_item_id || product.stock_id,
				...withInvoiceId(tableId),
			};

			// =============== get cart item data before deletion ================
			const [ cartItem, invoiceTable ] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : null,
			]);

			await window.dbAPI.deleteDataFromTable("invoice_table_item", itemCondition);

			if (tableId && invoiceTable) {
				await window.dbAPI.updateDataInTable("invoice_table", {
					id: tableId,
					data: { sub_total: invoiceTable.sub_total - product.sub_total },
				});
			}

			refetchInvoice();
		} catch (error) {
			showNotification("Request failed. Please try again.", "red", "", "", true);
			console.error(error);
		}
	};

	const updateQuantity = async (product, newQuantity) => {
		const vatConfig = configData?.inventory_config?.config_vat;

		try {
			const itemCondition = {
				stock_item_id: product.stock_item_id || product.stock_id,
				...withInvoiceId(tableId),
			};

			const [ items, invoiceTable ] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : Promise.resolve(null),
			]);

			if (!items?.length) {
				showNotification("Item not found in cart", "red", "", "", true);
				return;
			}

			const quantityValue = parseFloat(newQuantity) || 0;

			const updatedSubTotal = calculateSubTotalWithVAT(
				product.sales_price,
				quantityValue,
				vatConfig
			);

			const deltaSubTotal = updatedSubTotal - items[ 0 ].sub_total;

			// =============== preserve existing batches structure ================
			let existingBatches = [];
			try {
				existingBatches =
					typeof items[ 0 ].batches === "string"
						? JSON.parse(items[ 0 ].batches)
						: Array.isArray(items[ 0 ].batches)
							? items[ 0 ].batches
							: [];
			} catch {
				existingBatches = [];
			}

			await window.dbAPI.updateDataInTable("invoice_table_item", {
				condition: itemCondition,
				data: {
					...itemCondition,
					quantity: quantityValue,
					purchase_price: product.purchase_price,
					sales_price: product.sales_price,
					sub_total: updatedSubTotal,
					display_name: product.display_name,
					batches: JSON.stringify(existingBatches),
				},
			});

			if (tableId && invoiceTable) {
				await window.dbAPI.updateDataInTable("invoice_table", {
					id: tableId,
					data: { sub_total: invoiceTable.sub_total + deltaSubTotal },
				});
			}

			refetchInvoice();
		} catch (error) {
			showNotification("Request failed. Please try again.", "red", "", "", true);
			console.error(error);
		}
	};

	const clear = () => {
		dispatch(setCartData([]));
	};

	const getCartTotal = () => invoiceData?.reduce((sum, item) => sum + item.sub_total, 0) || 0;

	const getCartTotalQuantity = () =>
		invoiceData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

	return {
		invoiceData,
		increment,
		decrement,
		remove,
		updateQuantity,
		clear,
		refetchInvoice,
		getCartTotal,
		getCartTotalQuantity,
	};
}
