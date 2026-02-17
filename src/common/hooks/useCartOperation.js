import { showNotification } from "@components/ShowNotificationComponent";
import useConfigData from "./useConfigData";
import { calculateSubTotalWithVAT, withInvoiceId } from "@utils/index";
// import { useInlineUpdateMutation } from "@services/pos";
import { useOutletContext } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setCartData } from "@features/checkout";
import { useEffect, useCallback } from "react";
import { RESTRICT_PRODUCT_QUANTITY_LIMIT } from "@constants/index";
import { addProductSnapshot, removeProductSnapshot, clearProductSnapshots } from "@features/cart";

export default function useCartOperation(tableId = null) {
	const invoiceData = useSelector((state) => state.checkout.invoiceData);
	// const productSnapshots = useSelector((state) => state.cart.productSnapshots);
	const dispatch = useDispatch();
	const { isOnline } = useOutletContext();
	const { configData } = useConfigData({ offlineFetch: !isOnline });
	// const [inlineUpdate] = useInlineUpdateMutation();

	const refetchInvoice = useCallback(async () => {
		const data = await window.dbAPI.getDataFromTable("invoice_table_item");
		dispatch(setCartData(data));
	}, [dispatch]);

	useEffect(() => {
		refetchInvoice();
	}, [refetchInvoice]);

	// =============== helper function to update product quantity and sales in database ================
	const updateProductInDatabase = async (product, quantityDelta, batchUpdates = null) => {
		try {
			const stockItemId = product.stock_item_id || product.stock_id;

			// =============== fetch current product from database ================
			const currentProduct = await window.dbAPI.getDataFromTable("core_products", {
				stock_id: stockItemId,
			});
			if (!currentProduct || currentProduct.length === 0) {
				console.error("Product not found in database");
				return;
			}

			const productData = currentProduct[0];
			const newQuantity = (productData.quantity || 0) - quantityDelta;
			const newTotalSales = (productData.total_sales || 0) + quantityDelta;

			let updatedPurchaseItemForSales = productData.purchase_item_for_sales;

			// =============== update batch quantities if batch updates provided ================
			if (batchUpdates && Array.isArray(batchUpdates)) {
				try {
					const purchaseItems = JSON.parse(productData.purchase_item_for_sales || "[]");

					batchUpdates.forEach((batchUpdate) => {
						const batchIndex = purchaseItems.findIndex(
							(item) => item.purchase_item_id === batchUpdate.id
						);

						if (batchIndex !== -1) {
							purchaseItems[batchIndex].remain_quantity =
								(purchaseItems[batchIndex].remain_quantity || 0) - batchUpdate.quantityDelta;
							purchaseItems[batchIndex].sales_quantity =
								(purchaseItems[batchIndex].sales_quantity || 0) + batchUpdate.quantityDelta;
						}
					});

					updatedPurchaseItemForSales = JSON.stringify(purchaseItems);
				} catch (error) {
					console.error("Error updating batch data:", error);
				}
			}

			// =============== update product in database ================
			await window.dbAPI.updateDataInTable("core_products", {
				condition: { stock_id: stockItemId },
				data: {
					quantity: newQuantity,
					total_sales: newTotalSales,
					purchase_item_for_sales: updatedPurchaseItemForSales,
				},
			});
		} catch (error) {
			console.error("Error updating product in database:", error);
		}
	};

	const increment = async (product, selectedBatches = null, isUpdate = false) => {
		const vatConfig = configData?.inventory_config?.config_vat;

		try {
			// =============== store product snapshot ================
			const stockItemId = product.stock_item_id || product.stock_id;
			dispatch(addProductSnapshot({ stockItemId, product }));

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

			const [items, invoiceTable] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : Promise.resolve(null),
			]);

			let deltaSubTotal = 0;
			let totalQuantityToAdd = 1;

			// =============== calculate total quantity from selected batches ================
			if (selectedBatches && Array.isArray(selectedBatches)) {
				totalQuantityToAdd = selectedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
			}

			// =============== prepare batch updates for database ================
			let batchUpdates = null;
			if (selectedBatches && Array.isArray(selectedBatches)) {
				if (isUpdate && items?.length) {
					// =============== calculate difference for update mode ================
					let existingBatches = [];
					try {
						existingBatches =
							typeof items[0].batches === "string"
								? JSON.parse(items[0].batches)
								: Array.isArray(items[0].batches)
									? items[0].batches
									: [];
					} catch {
						existingBatches = [];
					}

					batchUpdates = selectedBatches.map((newBatch) => {
						const existingBatch = existingBatches.find((batch) => batch.id === newBatch.id);
						const oldQuantity = existingBatch ? existingBatch.quantity : 0;
						return {
							id: newBatch.id,
							quantityDelta: newBatch.quantity - oldQuantity,
						};
					});

					// =============== add batches that were removed in update ================
					existingBatches.forEach((oldBatch) => {
						const stillExists = selectedBatches.find((batch) => batch.id === oldBatch.id);
						if (!stillExists) {
							batchUpdates.push({
								id: oldBatch.id,
								quantityDelta: -oldBatch.quantity,
							});
						}
					});
				} else {
					// =============== add mode: all quantities are new ================
					batchUpdates = selectedBatches.map((batch) => ({
						id: batch.id,
						quantityDelta: batch.quantity,
					}));
				}
			}

			if (items?.length) {
				const oldQuantity = items[0].quantity;
				const updatedQuantity = isUpdate
					? totalQuantityToAdd
					: items[0].quantity + totalQuantityToAdd;
				const updatedSubTotal = calculateSubTotalWithVAT(
					product.sales_price,
					updatedQuantity,
					vatConfig
				);

				deltaSubTotal = updatedSubTotal - items[0].sub_total;

				// =============== update product database for quantity change ================
				const quantityDelta = isUpdate ? updatedQuantity - oldQuantity : totalQuantityToAdd;
				await updateProductInDatabase(product, quantityDelta, batchUpdates);

				// =============== handle batches ================
				let updatedBatches = [];

				if (isUpdate) {
					// =============== update mode: replace batches completely ================
					updatedBatches = selectedBatches || [];
				} else {
					// =============== add mode: merge batches ================
					let existingBatches = [];
					try {
						existingBatches =
							typeof items[0].batches === "string"
								? JSON.parse(items[0].batches)
								: Array.isArray(items[0].batches)
									? items[0].batches
									: [];
					} catch {
						existingBatches = [];
					}

					updatedBatches = [...existingBatches];

					if (selectedBatches && Array.isArray(selectedBatches)) {
						selectedBatches.forEach((newBatch) => {
							const existingBatchIndex = updatedBatches.findIndex(
								(batch) => batch.id === newBatch.id
							);
							if (existingBatchIndex !== -1) {
								updatedBatches[existingBatchIndex].quantity += newBatch.quantity;
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

				// =============== update product database for new item ================
				await updateProductInDatabase(product, totalQuantityToAdd, batchUpdates);

				// =============== prepare batches for new item ================
				const batchesData =
					selectedBatches && Array.isArray(selectedBatches)
						? JSON.stringify(selectedBatches)
						: JSON.stringify([]);

				await window.dbAPI.upsertIntoTable("invoice_table_item", {
					stock_item_id: product.stock_item_id || product.stock_id,
					quantity: totalQuantityToAdd,
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

			const [items, invoiceTable] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : Promise.resolve(null),
			]);

			if (!items?.length || items[0].quantity <= 1) return;

			const updatedQuantity = items[0].quantity - 1;
			const updatedSubTotal = calculateSubTotalWithVAT(
				product.sales_price,
				updatedQuantity,
				vatConfig
			);

			const deltaSubTotal = updatedSubTotal - items[0].sub_total;

			// =============== handle batch decrement ================
			let existingBatches = [];
			let decrementedBatchId = null;
			try {
				existingBatches =
					typeof items[0].batches === "string"
						? JSON.parse(items[0].batches)
						: Array.isArray(items[0].batches)
							? items[0].batches
							: [];
			} catch {
				existingBatches = [];
			}

			// =============== decrement from the last batch ================
			if (existingBatches.length > 0) {
				for (let index = existingBatches.length - 1; index >= 0; index--) {
					if (existingBatches[index].quantity > 0) {
						decrementedBatchId = existingBatches[index].id;
						existingBatches[index].quantity -= 1;
						if (existingBatches[index].quantity === 0) {
							existingBatches.splice(index, 1);
						}
						break;
					}
				}
			}

			// =============== restore product quantity and sales in database ================
			const batchUpdates = decrementedBatchId
				? [{ id: decrementedBatchId, quantityDelta: -1 }]
				: null;
			await updateProductInDatabase(product, -1, batchUpdates);

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
			const [cartItem, invoiceTable] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : null,
			]);

			// =============== restore product quantity and sales ================
			if (cartItem?.length) {
				const removedQuantity = cartItem[0].quantity;
				let batchUpdates = null;

				// =============== get batch data to restore ================
				let existingBatches = [];
				try {
					existingBatches =
						typeof cartItem[0].batches === "string"
							? JSON.parse(cartItem[0].batches)
							: Array.isArray(cartItem[0].batches)
								? cartItem[0].batches
								: [];
				} catch {
					existingBatches = [];
				}

				if (existingBatches.length > 0) {
					batchUpdates = existingBatches.map((batch) => ({
						id: batch.id,
						quantityDelta: -batch.quantity,
					}));
				}

				await updateProductInDatabase(product, -removedQuantity, batchUpdates);

				// =============== remove product snapshot ================
				const stockItemId = product.stock_item_id || product.stock_id;
				dispatch(removeProductSnapshot(stockItemId));
			}

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

			const [items, invoiceTable] = await Promise.all([
				window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
				tableId ? window.dbAPI.getDataFromTable("invoice_table", tableId) : Promise.resolve(null),
			]);

			if (!items?.length) {
				showNotification("Item not found in cart", "red", "", "", true);
				return;
			}

			const quantityValue = parseFloat(newQuantity) || 0;
			const oldQuantity = items[0].quantity;
			const quantityDelta = quantityValue - oldQuantity;

			const updatedSubTotal = calculateSubTotalWithVAT(
				product.sales_price,
				quantityValue,
				vatConfig
			);

			const deltaSubTotal = updatedSubTotal - items[0].sub_total;

			// =============== update product database ================
			if (quantityDelta !== 0) {
				await updateProductInDatabase(product, quantityDelta, null);
			}

			// =============== preserve existing batches structure ================
			let existingBatches = [];
			try {
				existingBatches =
					typeof items[0].batches === "string"
						? JSON.parse(items[0].batches)
						: Array.isArray(items[0].batches)
							? items[0].batches
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
		dispatch(clearProductSnapshots());
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
