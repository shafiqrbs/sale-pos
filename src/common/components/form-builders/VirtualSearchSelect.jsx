import { Box } from "@mantine/core";
import { escapeHtmlForVirtualSelectEmptyState } from "@utils/index";
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
 * @param {string} [nothingFoundMessage] - plain message when nothingFoundHtml is omitted (escaped for innerHTML)
 * @param {string} [nothingFoundHtml] - raw HTML for empty panels; overrides nothingFoundMessage when provided
 * @param {(action: string) => void} [onNothingFoundAction] - receives the value of data-virtual-search-empty-action from a clicked node inside the empty panel
 * @param {(value: string, option: any) => void} [onChange] - called with (value, full option object)
 */
export default function VirtualSearchSelect({
	value = null,
	options = [],
	placeholder = "Select",
	searchable = true,
	disabled = false,
	showOptionsOnlyOnSearch = false,
	nothingFoundMessage = "No results found",
	nothingFoundHtml,
	onNothingFoundAction,
	onChange,
	id,
	nextField,
}) {
	const containerRef = useRef(null);
	const virtualSelectInstanceRef = useRef(null);

	const emptyStateHtml = useMemo(() => {
		if (typeof nothingFoundHtml === "string") {
			return nothingFoundHtml;
		}
		return escapeHtmlForVirtualSelectEmptyState(nothingFoundMessage || "No results found");
	}, [ nothingFoundHtml, nothingFoundMessage ]);

	const emptyStateHtmlRef = useRef(emptyStateHtml);
	emptyStateHtmlRef.current = emptyStateHtml;

	const onNothingFoundActionRef = useRef(onNothingFoundAction);
	onNothingFoundActionRef.current = onNothingFoundAction;

	// =============== O(1) lookup for selected option when change fires ===============
	const optionMap = useMemo(() => {
		const map = new Map();
		options.forEach((option) => map.set(String(option.value), option));
		return map;
	}, [ options ]);

	const onChangeRef = useRef(onChange);
	const optionMapRef = useRef(optionMap);
	const nextFieldRef = useRef(nextField);
	onChangeRef.current = onChange;
	optionMapRef.current = optionMap;
	nextFieldRef.current = nextField;

	// =============== init on mount, destroy on unmount; single init with initial options/value ===============
	useEffect(() => {
		const containerElement = containerRef.current;
		if (!containerElement || typeof window === "undefined" || !window.VirtualSelect) {
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
			showOptionsOnlyOnSearch: showOptionsOnlyOnSearch,
			ele: containerElement,
			options: normalizedOptions,
			search: !!searchable,
			placeholder: placeholder || "Select",
			maxWidth: "100%",
			overflow: "hidden",
			selectedValue: value != null ? String(value) : "",
			noOptionsText: emptyStateHtmlRef.current,
			noSearchResultsText: emptyStateHtmlRef.current,
			disabled: !!disabled,
		});

		virtualSelectInstanceRef.current = containerElement.virtualSelect;

		// =============== tracks whether a value was selected in the current open/close cycle;
		// afterClose should only move focus when the user actually picked a value, not when
		// they dismissed the dropdown by clicking elsewhere ===============
		let didSelectValue = false;

		const handleChange = (event) => {
			const selectedValue =
				event.target != null && event.target.value != null ? String(event.target.value) : "";
			const option = optionMapRef.current.get(selectedValue);
			onChangeRef.current?.(selectedValue, option);
			didSelectValue = true;
		};

		// =============== use afterClose instead of setTimeout(0) so focus moves only after the
		// dropdown is fully closed — this fixes mouse-click selection not focusing nextField
		// because with mouse, the dropdown is still animating when setTimeout(0) would fire ===============
		const handleAfterClose = () => {
			if (!didSelectValue) return;
			didSelectValue = false;
			const targetField = nextFieldRef.current;
			if (!targetField) return;
			const nextElement = document.getElementById(targetField);
			if (nextElement) nextElement.focus();
		};

		containerElement.addEventListener("change", handleChange);
		containerElement.addEventListener("afterClose", handleAfterClose);

		return () => {
			containerElement.removeEventListener("change", handleChange);
			containerElement.removeEventListener("afterClose", handleAfterClose);
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
	}, [ value ]);

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
	}, [ options ]);

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
	}, [ disabled ]);

	// =============== sync empty-state html and delegate action clicks; both care about the same panel nodes ===============
	useEffect(() => {
		const root = containerRef.current;
		if (!root) {
			return undefined;
		}

		const noSearchResults = root.querySelector(".vscomp-no-search-results");
		const noOptions = root.querySelector(".vscomp-no-options");

		if (noSearchResults) noSearchResults.innerHTML = emptyStateHtml;
		if (noOptions) noOptions.innerHTML = emptyStateHtml;

		const handleClick = (event) => {
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}
			const trigger = target.closest("[data-virtual-search-empty-action]");
			if (!trigger) {
				return;
			}
			event.preventDefault();
			event.stopPropagation();
			onNothingFoundActionRef.current?.(trigger.getAttribute("data-virtual-search-empty-action") || "");
		};

		root.addEventListener("click", handleClick);
		return () => root.removeEventListener("click", handleClick);
	}, [ emptyStateHtml ]);

	return (
		<Box ref={containerRef} id={id} className="virtual-search-select-wrapper" />
	);
}
