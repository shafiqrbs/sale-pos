import { showNotification } from "@components/ShowNotificationComponent";
import useConfigData from "./useConfigData";
import { calculateSubTotalWithVAT } from "@utils/index";
import { useInlineUpdateMutation } from "@services/pos";
import { useOutletContext } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { setInvoiceData } from "@services/checkout";
import { useEffect } from "react";

export default function useCartOperation() {
    const invoiceData = useSelector((state) => state.checkout.invoiceData);
    const dispatch = useDispatch();
    const { isOnline } = useOutletContext();
    const { configData } = useConfigData({ offlineFetch: !isOnline })
    const [ inlineUpdate ] = useInlineUpdateMutation();

    const refetchInvoice = async () => {
        const data = await window.dbAPI.getDataFromTable("invoice_table_item");
        dispatch(setInvoiceData(data));
    };

    useEffect(() => {
        let mounted = true;

        if (mounted) {
            refetchInvoice()
        }

        return () => {
            mounted = false;
        };
    }, []);

    const increment = async (product, tableId = null) => {
        const vatConfig = configData?.inventory_config?.config_vat;

        console.log(product)

        try {
            if (isOnline) {
                const data = {
                    invoice_id: tableId,
                    field_name: "items",
                    value: {
                        ...product,
                        quantity: 1,
                    },
                };
                const res = await inlineUpdate(data).unwrap();

                if (res?.status !== 200) {
                    showNotification(
                        res?.message || "Error updating invoice",
                        "red",
                        "",
                        "",
                        true
                    );
                }
            } else {
                let newSubTotal = 0;
                const [ invoiceTableItem, invoiceTable ] = await Promise.all([
                    window.dbAPI.getDataFromTable("invoice_table_item", {
                        // invoice_id: tableId ? tableId : undefined,
                        stock_item_id: product.stock_item_id || product.stock_id,
                    }),
                    window.dbAPI.getDataFromTable("invoice_table", tableId),
                ]);

                if (invoiceTableItem?.length) {
                    const updatedQuantity = invoiceTableItem[ 0 ].quantity + 1;
                    const updatedSubTotal = calculateSubTotalWithVAT(
                        product.sales_price,
                        updatedQuantity,
                        vatConfig
                    );
                    const deltaSubTotal = updatedSubTotal - invoiceTableItem[ 0 ].sub_total;

                    await window.dbAPI.updateDataInTable("invoice_table_item", {
                        condition: {
                            // invoice_id: tableId ? tableId : undefined,
                            stock_item_id: product.stock_item_id || product.stock_id,
                        },
                        data: {
                            stock_item_id: product.stock_item_id || product.stock_id,
                            invoice_id: tableId,
                            quantity: updatedQuantity,
                            purchase_price: product.purchase_price,
                            sales_price: product.sales_price,
                            sub_total: updatedSubTotal,
                            display_name: product.display_name,
                        },
                    });
                    newSubTotal = deltaSubTotal;
                } else {
                    const subTotal = calculateSubTotalWithVAT(product.sales_price, 1, vatConfig);
                    await window.dbAPI.upsertIntoTable("invoice_table_item", {
                        stock_item_id: product.stock_item_id || product.stock_id,
                        // invoice_id: tableId ? tableId : undefined,
                        quantity: 1,
                        purchase_price: 0,
                        sales_price: product.sales_price,
                        custom_price: 0,
                        is_print: 0,
                        sub_total: subTotal,
                        display_name: product.display_name,
                    });
                    newSubTotal = subTotal;
                }

                refetchInvoice();
                await window.dbAPI.updateDataInTable("invoice_table", {
                    id: tableId,
                    data: {
                        sub_total: invoiceTable.sub_total + newSubTotal,
                    },
                });
            }

        } catch (error) {
            showNotification("Request failed. Please try again.", "red", "", "", true);
            console.error("Error updating invoice:", error);
        }
    }

    const decrement = async (product, tableId) => {
        // Get VAT config from config_data
        const vatConfig = configData?.inventory_config?.config_vat;
        console.log(product)
        try {
            if (isOnline) {
                const data = {
                    invoice_id: tableId,
                    field_name: "items",
                    value: {
                        ...product,
                        quantity: -1,
                    },
                };
                const res = await inlineUpdate(data).unwrap();

                if (res?.status !== 200) {
                    showNotification(
                        res?.message || "Error updating invoice",
                        "red",
                        "",
                        "",
                        true
                    );
                }
            } else {
                let newSubTotal = 0;
                const [ invoiceTableItem, invoiceTable ] = await Promise.all([
                    window.dbAPI.getDataFromTable("invoice_table_item", {
                        // invoice_id: tableId ? tableId : undefined,
                        stock_item_id: product.stock_item_id || product.stock_id,
                    }),
                    window.dbAPI.getDataFromTable("invoice_table", tableId),
                ]);


                if (invoiceTableItem?.length) {
                    const currentQuantity = invoiceTableItem[ 0 ].quantity;

                    if (currentQuantity <= 1) return;

                    const updatedQuantity = currentQuantity - 1;
                    const updatedSubTotal = calculateSubTotalWithVAT(
                        product.sales_price,
                        updatedQuantity,
                        vatConfig
                    );
                    const deltaSubTotal = updatedSubTotal - invoiceTableItem[ 0 ].sub_total;

                    await window.dbAPI.updateDataInTable("invoice_table_item", {
                        condition: {
                            // invoice_id: tableId ? tableId : undefined,
                            stock_item_id: product.stock_item_id || product.stock_id,
                        },
                        data: {
                            stock_item_id: product.stock_item_id || product.stock_id,
                            invoice_id: tableId,
                            quantity: updatedQuantity,
                            purchase_price: product.purchase_price,
                            sales_price: product.sales_price,
                            sub_total: updatedSubTotal,
                            display_name: product.display_name,
                        },
                    });

                    newSubTotal = deltaSubTotal;
                    refetchInvoice();
                    await window.dbAPI.updateDataInTable("invoice_table", {
                        id: tableId,
                        data: {
                            sub_total: invoiceTable.sub_total + newSubTotal,
                        },
                    });
                }
            }
        } catch (error) {
            showNotification("Request failed. Please try again.", "red", "", "", true);
            console.error("Error updating invoice:", error);
        }
    }

    const remove = async (product, tableId) => {
        try {
            const invoiceTable = await window.dbAPI.getDataFromTable("invoice_table", {
                id: tableId,
            });

            console.log(product)

            if (isOnline) {
                const data = {
                    invoice_id: tableId,
                    field_name: "items",
                    value: [],
                };
                const resultAction = await inlineUpdate(data).unwrap();
                if (resultAction?.status !== 200) {
                    showNotification(
                        resultAction?.message || "Error updating invoice",
                        "red",
                        "",
                        "",
                        true
                    );
                }
            } else {
                await window.dbAPI.deleteDataFromTable("invoice_table_item", {
                    stock_item_id: product.stock_item_id || product.stock_id,
                });

                // await Promise.all([
                //     // window.dbAPI.deleteDataFromTable("invoice_table_item", {
                //     //     invoice_id: tableId,
                //     //     stock_item_id: product.stock_item_id || product.stock_id,
                //     // }),
                //     window.dbAPI.updateDataInTable("invoice_table", {
                //         id: tableId,
                //         data: {
                //             sub_total: invoiceTable.sub_total - product.sub_total,
                //         },
                //     }),
                // ]);
            }
            showNotification("Item removed from cart", "green", "", "", true);
            refetchInvoice();
        } catch (error) {
            showNotification("Request failed. Please try again.", "red", "", "", true);
            console.error("Error updating invoice:", error);
        }
    }

    const clear = () => {
        console.log("clear")
    }


    const getCart = () => {
        console.log("getCart")
    }

    const getCartTotal = () => {
        console.log("getCartTotal")
    }

    const getCartTotalQuantity = () => {
        console.log("getCartTotalQuantity")
    }

    const getCartTotalPrice = () => {
        console.log("getCartTotalPrice")
    }

    return { invoiceData, increment, decrement, remove, clear, getCart, getCartTotal, getCartTotalQuantity, getCartTotalPrice }
}
