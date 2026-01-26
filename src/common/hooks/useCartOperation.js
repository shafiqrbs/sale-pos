import { showNotification } from "@components/ShowNotificationComponent";
import useConfigData from "./useConfigData";
import { calculateSubTotalWithVAT, withInvoiceId } from "@utils/index";
import { useInlineUpdateMutation } from "@services/pos";
import { useOutletContext } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setInvoiceData } from "@services/checkout";
import { useEffect } from "react";

export default function useCartOperation(tableId = null) {
    const invoiceData = useSelector((state) => state.checkout.invoiceData);
    const dispatch = useDispatch();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline });
    const [ inlineUpdate ] = useInlineUpdateMutation();

    const refetchInvoice = async () => {
        const data = await window.dbAPI.getDataFromTable("invoice_table_item");
        dispatch(setInvoiceData(data));
    };

    useEffect(() => {
        refetchInvoice();
    }, []);

    const increment = async (product) => {
        const vatConfig = configData?.inventory_config?.config_vat;

        try {
            if (isOnline) {
                const payload = {
                    ...withInvoiceId(tableId),
                    field_name: "items",
                    value: { ...product, quantity: 1 },
                };

                const res = await inlineUpdate(payload).unwrap();
                if (res?.status !== 200) {
                    showNotification(res?.message || "Error updating invoice", "red", "", "", true);
                }
                return;
            }

            const itemCondition = {
                stock_item_id: product.stock_item_id || product.stock_id,
                ...withInvoiceId(tableId),
            };

            const [ items, invoiceTable ] = await Promise.all([
                window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
                tableId
                    ? window.dbAPI.getDataFromTable("invoice_table", tableId)
                    : Promise.resolve(null),
            ]);

            let deltaSubTotal = 0;

            if (items?.length) {
                const updatedQuantity = items[ 0 ].quantity + 1;
                const updatedSubTotal = calculateSubTotalWithVAT(
                    product.sales_price,
                    updatedQuantity,
                    vatConfig
                );

                deltaSubTotal = updatedSubTotal - items[ 0 ].sub_total;

                await window.dbAPI.updateDataInTable("invoice_table_item", {
                    condition: itemCondition,
                    data: {
                        ...itemCondition,
                        quantity: updatedQuantity,
                        purchase_price: product.purchase_price,
                        sales_price: product.sales_price,
                        sub_total: updatedSubTotal,
                        display_name: product.display_name,
                    },
                });
            } else {
                const subTotal = calculateSubTotalWithVAT(product.sales_price, 1, vatConfig);
                deltaSubTotal = subTotal;

                await window.dbAPI.upsertIntoTable("invoice_table_item", {
                    stock_item_id: product.stock_item_id || product.stock_id,
                    quantity: 1,
                    purchase_price: 0,
                    sales_price: product.sales_price,
                    custom_price: 0,
                    is_print: 0,
                    sub_total: subTotal,
                    display_name: product.display_name,
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
            if (isOnline) {
                const payload = {
                    ...withInvoiceId(tableId),
                    field_name: "items",
                    value: { ...product, quantity: -1 },
                };

                const res = await inlineUpdate(payload).unwrap();
                if (res?.status !== 200) {
                    showNotification(res?.message || "Error updating invoice", "red", "", "", true);
                }
                return;
            }

            const itemCondition = {
                stock_item_id: product.stock_item_id || product.stock_id,
                ...withInvoiceId(tableId),
            };

            const [ items, invoiceTable ] = await Promise.all([
                window.dbAPI.getDataFromTable("invoice_table_item", itemCondition),
                tableId
                    ? window.dbAPI.getDataFromTable("invoice_table", tableId)
                    : Promise.resolve(null),
            ]);

            if (!items?.length || items[ 0 ].quantity <= 1) return;

            const updatedQuantity = items[ 0 ].quantity - 1;
            const updatedSubTotal = calculateSubTotalWithVAT(
                product.sales_price,
                updatedQuantity,
                vatConfig
            );

            const deltaSubTotal = updatedSubTotal - items[ 0 ].sub_total;

            await window.dbAPI.updateDataInTable("invoice_table_item", {
                condition: itemCondition,
                data: {
                    ...itemCondition,
                    quantity: updatedQuantity,
                    purchase_price: product.purchase_price,
                    sales_price: product.sales_price,
                    sub_total: updatedSubTotal,
                    display_name: product.display_name,
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
            if (isOnline) {
                const payload = {
                    ...withInvoiceId(tableId),
                    field_name: "items",
                    value: [],
                };

                const res = await inlineUpdate(payload).unwrap();
                if (res?.status !== 200) {
                    showNotification(res?.message || "Error updating invoice", "red", "", "", true);
                }
                refetchInvoice();
                return;
            }

            const invoiceTable = tableId
                ? await window.dbAPI.getDataFromTable("invoice_table", tableId)
                : null;

            await window.dbAPI.deleteDataFromTable("invoice_table_item", {
                stock_item_id: product.stock_item_id || product.stock_id,
                ...withInvoiceId(tableId),
            });

            if (tableId && invoiceTable) {
                await window.dbAPI.updateDataInTable("invoice_table", {
                    id: tableId,
                    data: { sub_total: invoiceTable.sub_total - product.sub_total },
                });
            }

            showNotification("Item removed from cart", "green", "", "", true);
            refetchInvoice();
        } catch (error) {
            showNotification("Request failed. Please try again.", "red", "", "", true);
            console.error(error);
        }
    };

    const clear = () => dispatch(setInvoiceData([]));

    const getCartTotal = () =>
        invoiceData?.reduce((sum, item) => sum + item.sub_total, 0) || 0;

    const getCartTotalQuantity = () =>
        invoiceData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return {
        invoiceData,
        increment,
        decrement,
        remove,
        clear,
        getCartTotal,
        getCartTotalQuantity,
    };
}
