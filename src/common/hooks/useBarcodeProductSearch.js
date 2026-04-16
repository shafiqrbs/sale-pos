import { useState, useEffect, useRef } from "react";
import useLocalProductLookup from "./useLocalProductLookup";

const BARCODE_DEBOUNCE_MS = 600;

/**
 * Manages barcode scanner / keyboard input with a 600ms debounce.
 * Searches core_products by the barcode field and tracks the found product.
 *
 * @returns {{
 *   barcodeValue: string,
 *   setBarcodeValue: Function,
 *   foundProduct: Object|null,
 *   isSearching: boolean,
 *   clearBarcode: Function,
 * }}
 */
export default function useBarcodeProductSearch() {
	const [barcodeValue, setBarcodeValue] = useState("");
	const [foundProduct, setFoundProduct] = useState(null);
	const { getProductByBarcode, loading: isSearching } = useLocalProductLookup();
	const debounceTimerRef = useRef(null);

	useEffect(() => {
		if (debounceTimerRef.current) {
			clearTimeout(debounceTimerRef.current);
		}

		const trimmedBarcode = barcodeValue.trim();

		if (!trimmedBarcode) {
			setFoundProduct(null);
			return;
		}

		debounceTimerRef.current = setTimeout(async () => {
			const product = await getProductByBarcode(trimmedBarcode);
			setFoundProduct(product ?? null);
		}, BARCODE_DEBOUNCE_MS);

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [barcodeValue]);

	const clearBarcode = () => {
		setBarcodeValue("");
		setFoundProduct(null);
	};

	return { barcodeValue, setBarcodeValue, foundProduct, isSearching, clearBarcode };
}
