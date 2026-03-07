import { useEffect, useMemo, useRef } from "react";

// =============== load virtual-select-plugin once; script attaches VirtualSelect to window ===============
import "virtual-select-plugin/dist/virtual-select.min.css";
import "virtual-select-plugin/dist/virtual-select.min.js";

/**
 * Reusable virtualized search select for large option lists (20k+).
 * Uses virtual-select-plugin; controlled via value/onChange; compatible with Mantine useForm.
 *
 * @param {string | null} value - controlled value (option value string)
 * @param {Array<{ label: string; value: string; [key: string]: any }>} options - option list
 * @param {string} [placeholder] - placeholder text
 * @param {boolean} [searchable] - enable search
 * @param {boolean} [disabled] - disable the select
 * @param {string} [nothingFoundMessage] - message when no options or no search results
 * @param {(value: string, option: any) => void} [onChange] - called with (value, full option object)
 */
export default function VirtualSearchSelect({
	value = null,
	options = [],
	placeholder = "Select",
	searchable = true,
	disabled = false,
	nothingFoundMessage = "No results found",
	onChange,
	id,
}) {
	const containerRef = useRef(null);
	const virtualSelectInstanceRef = useRef(null);

	// =============== O(1) lookup for selected option when change fires ===============
	const optionMap = useMemo(() => {
		const map = new Map();
		options.forEach((option) => map.set(String(option.value), option));
		return map;
	}, [options]);

	const onChangeRef = useRef(onChange);
	const optionMapRef = useRef(optionMap);
	onChangeRef.current = onChange;
	optionMapRef.current = optionMap;

	// =============== init on mount, destroy on unmount; single init with initial options/value ===============
	useEffect(() => {
		const containerElement = containerRef.current;
		if (
			!containerElement ||
			typeof window === "undefined" ||
			!window.VirtualSelect
		) {
			return;
		}

		const VirtualSelect = window.VirtualSelect;
		const normalizedOptions = Array.isArray(options)
			? options.map((option) => ({
					label: option.label,
					value: String(option.value),
					...option,
				}))
			: [];

		VirtualSelect.init({
			ele: containerElement,
			options: normalizedOptions,
			search: !!searchable,
			placeholder: placeholder || "Select",
			maxWidth: "100%",
			selectedValue: value != null ? String(value) : "",
			noOptionsText: nothingFoundMessage || "No options found",
			noSearchResultsText: nothingFoundMessage || "No results found",
			disabled: !!disabled,
		});

		virtualSelectInstanceRef.current = containerElement.virtualSelect;

		const handleChange = (event) => {
			const selectedValue =
				event.target != null && event.target.value != null
					? String(event.target.value)
					: "";
			const option = optionMapRef.current.get(selectedValue);
			onChangeRef.current?.(selectedValue, option);
		};

		containerElement.addEventListener("change", handleChange);

		return () => {
			containerElement.removeEventListener("change", handleChange);
			if (typeof containerElement.destroy === "function") {
				containerElement.destroy();
			}
			virtualSelectInstanceRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- init once; value/options synced in separate effects
	}, []);

	// =============== keep value in sync when parent updates (controlled component) ===============
	useEffect(() => {
		const containerElement = containerRef.current;
		if (!containerElement || typeof containerElement.setValue !== "function") {
			return;
		}
		const nextValue = value != null ? String(value) : "";
		containerElement.setValue(nextValue, true);
	}, [value]);

	// =============== update options when list changes (e.g. products refetched) ===============
	useEffect(() => {
		const containerElement = containerRef.current;
		if (!containerElement || typeof containerElement.setOptions !== "function") {
			return;
		}
		const normalizedOptions = Array.isArray(options)
			? options.map((option) => ({
					label: option.label,
					value: String(option.value),
					...option,
				}))
			: [];
		containerElement.setOptions(normalizedOptions, true);
	}, [options]);

	// =============== update disabled state when prop changes ===============
	useEffect(() => {
		const containerElement = containerRef.current;
		if (!containerElement) return;
		if (disabled) {
			if (typeof containerElement.disable === "function") {
				containerElement.disable();
			}
		} else {
			if (typeof containerElement.enable === "function") {
				containerElement.enable();
			}
		}
	}, [disabled]);

	return <div ref={containerRef} id={id} className="virtual-search-select-wrapper" />;
}
