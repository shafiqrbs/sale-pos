import {ActionIcon, Flex, Select, TextInput, Button, Text, Box} from "@mantine/core";
import { IconFileTypeXls, IconRestore, IconSearch, IconX } from "@tabler/icons-react";
import AdvancedFilter from "@components/AdvancedFilter";
import React, { useState, useEffect } from "react";
import { DateInput } from "@mantine/dates";
import { formatDate, formatDateISO } from "@utils";
import { useDebouncedCallback } from "@mantine/hooks";
import { parseDateString } from "@utils/index";
import DateInputForm from "@components/form-builders/DateInputForm";
import { useTranslation } from "react-i18next";

export default function KeywordSearch({
	form,
	onSearch,
	onReset,
	placeholder = "Keyword Search",
	reportName,
	tooltip = "Search by product name, unit, quantity, price, etc.",
	showDatePicker = false,
	showStartEndDate = false,
	showAdvancedFilter = true,
	showKeywordSearch = true,
	showReset = true,
	className = "keyword-search-box",
	handleCSVDownload = () => {},
}) {
	const { t } = useTranslation();
	const [term, setTerm] = useState(form.values.term || "");
	const [date, setDate] = useState(null);
	const [startDate, setStartDate] = useState(null);
	const [endDate, setEndDate] = useState(null);
	// =============== debounce keyword to control api calls via form state ================
	const debouncedSetKeywordInForm = useDebouncedCallback((value) => {
		form.setFieldValue("term", value);
	}, 500);

	useEffect(() => {
		if (form.values?.term) {
			// disableeslint-disable-next-line react-hooks/exhaustive-deps
			setTerm(form.values.term);
		}
		if (form.values?.created) {
			setDate(parseDateString(form.values.created));
		}
		if (showStartEndDate) {
			setStartDate(parseDateString(form.values?.start_date));
			setEndDate(parseDateString(form.values?.end_date));
		}
	}, [
		form.values.keywordSearch,
		String(form.values.created),
		showStartEndDate,
		String(form.values?.start_date),
		String(form.values?.end_date),
	]);

	// =============== handle search functionality ================
	const handleSearch = (searchData) => {
		const data =
			searchData ||
			(showStartEndDate
				? {
						term,
						start_date: startDate ? formatDateISO(startDate) : "",
						end_date: endDate ? formatDateISO(endDate) : "",
					}
				: {
						term,
						created: date ? formatDate(date) : "",
					});

		if (onSearch) {
			onSearch(data);
		}
	};

	// =============== handle keyword change ================
	const handleKeywordChange = (value) => {
		setTerm(value);
		debouncedSetKeywordInForm(value);
	};

	// =============== handle date change ================
	const handleDateChange = (value) => {
		form.setFieldValue("created", value ? formatDate(value) : "");
		setDate(value);
		handleSearch({ term, created: value ? formatDate(value) : "" });
	};

	// =============== handle start date change for date range ================
	const handleStartDateChange = (value) => {
		form.setFieldValue("start_date", value ? formatDateISO(value) : "");
		setStartDate(value);
		handleSearch({
			term,
			start_date: value ? formatDateISO(value) : "",
			end_date: endDate ? formatDateISO(endDate) : "",
		});
	};

	// =============== handle end date change for date range ================
	const handleEndDateChange = (value) => {
		form.setFieldValue("end_date", value ? formatDateISO(value) : "");
		setEndDate(value);
		handleSearch({
			term,
			start_date: startDate ? formatDateISO(startDate) : "",
			end_date: value ? formatDateISO(value) : "",
		});
	};

	// =============== handle reset functionality ================
	const handleReset = () => {
		form.setFieldValue("term", "");
		debouncedSetKeywordInForm.flush?.();

		form.setFieldValue("created", null);
		setTerm("");
		setDate(null);

		if (showStartEndDate) {
			form.setFieldValue("start_date", "");
			form.setFieldValue("end_date", "");
			setStartDate(null);
			setEndDate(null);
		}

		const resetData = showStartEndDate
			? { keywordSearch: "", start_date: "", end_date: "" }
			: { keywordSearch: "", created: "" };
		if (onReset) {
			onReset(resetData);
		}
	};

	return (
		<Flex gap="xs" className={className} w="100%">
			{showDatePicker && (
				<DateInput
					clearable
					name="created"
					placeholder={t("SelectDate")}
					value={date}
					onChange={handleDateChange}
					miw={200}
				/>
			)}
			{showStartEndDate && (
				<>
					<DateInput
						clearable
						name="start_date"
						placeholder={t("StartDate")}
						value={startDate}
						onChange={handleStartDateChange}
						miw={200}
					/>
					<DateInput
						clearable
						name="end_date"
						placeholder={t("EndDate")}
						value={endDate}
						onChange={handleEndDateChange}
						miw={200}
					/>
				</>
			)}
			{showKeywordSearch === true &&(
			<TextInput
				placeholder={placeholder}
				tooltip={tooltip}
				name="keywordSearch"
				value={term}
				leftSection={
					term ? (
						<IconX size={16} stroke={1.5} color="var(--theme-error-color)" onClick={handleReset} />
					) : (
						<IconSearch size={16} stroke={1.5} />
					)
				}
				styles={{ root: { width: "100%" } }}
				onChange={(event) => handleKeywordChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === "Enter") {
						handleSearch();
					}
				}}
			/>
			)}
			<Flex gap="3xs" align="center">
				<Button
					c="var(--theme-primary-color-6)"
					bg="var(--mantine-color-white)"
					bd="1px solid var(--theme-grey-color-1)"
					variant="filled"
					leftSection={<IconSearch size={16} stroke={1.5} />}
					onClick={() => handleSearch()}
				>
					Search
				</Button>

				{showReset && (
					<ActionIcon
						size="lg"
						c="var(--theme-tertiary-color-8)"
						bg="var(--mantine-color-white)"
						onClick={handleReset}
						bd="1px solid var(--theme-grey-color-1)"
					>
						<IconRestore size={16} stroke={1.5} />
					</ActionIcon>
				)}

				{showAdvancedFilter && <AdvancedFilter />}

				<ActionIcon
					size="lg"
					c="var(--theme-success-color-3)"
					bg="var(--mantine-color-white)"
					onClick={handleCSVDownload}
					bd="1px solid var(--theme-grey-color-1)"
				>
					<IconFileTypeXls size={16} stroke={1.5} />
				</ActionIcon>
			</Flex>
		</Flex>
	);
}
