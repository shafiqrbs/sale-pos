import { ActionIcon, Flex, Select, TextInput } from "@mantine/core";
import { IconFileTypeXls, IconRestore, IconSearch, IconX } from "@tabler/icons-react";
import AdvancedFilter from "@components/AdvancedFilter";
import { useState, useEffect } from "react";
import { DateInput } from "@mantine/dates";
import { formatDate, formatDateISO } from "@utils";
import { useDebouncedCallback } from "@mantine/hooks";
import { parseDateString } from "@utils/index";

export default function KeywordSearch({
    form,
    onSearch,
    onReset,
    placeholder = "Keyword Search",
    tooltip = "Search by product name, unit, quantity, price, etc.",
    showDatePicker = false,
    showStartEndDate = false,
    showAdvancedFilter = true,
    showReset = true,
    className = "keyword-search-box",
    handleCSVDownload = () => { },
}) {
    const [ keywordSearch, setKeywordSearch ] = useState(form.values.keywordSearch || "");
    const [ date, setDate ] = useState(null);
    const [ startDate, setStartDate ] = useState(null);
    const [ endDate, setEndDate ] = useState(null);
    // =============== debounce keyword to control api calls via form state ================
    const debouncedSetKeywordInForm = useDebouncedCallback((value) => {
        form.setFieldValue("keywordSearch", value);
    }, 500);

    useEffect(() => {
        if (form.values?.keywordSearch) {
            setKeywordSearch(form.values.keywordSearch);
        }
        if (form.values?.created) {
            setDate(parseDateString(form.values.created));
        }
        if (showStartEndDate) {
            setStartDate(parseDateString(form.values?.start_date));
            setEndDate(parseDateString(form.values?.end_date));
        }
    }, [ form.values.keywordSearch, String(form.values.created), showStartEndDate, String(form.values?.start_date), String(form.values?.end_date) ]);

    // =============== handle search functionality ================
    const handleSearch = (searchData) => {
        const data = searchData || (showStartEndDate
            ? {
                keywordSearch,
                start_date: startDate ? formatDateISO(startDate) : "",
                end_date: endDate ? formatDateISO(endDate) : "",
            }
            : {
                keywordSearch,
                created: date ? formatDate(date) : "",
            });

        if (onSearch) {
            onSearch(data);
        }
    };

    // =============== handle keyword change ================
    const handleKeywordChange = (value) => {
        setKeywordSearch(value);
        debouncedSetKeywordInForm(value);
    };

    // =============== handle date change ================
    const handleDateChange = (value) => {
        form.setFieldValue("created", value ? formatDate(value) : "");
        setDate(value);
        handleSearch({ keywordSearch, created: value ? formatDate(value) : "" });
    };

    // =============== handle start date change for date range ================
    const handleStartDateChange = (value) => {
        form.setFieldValue("start_date", value ? formatDateISO(value) : "");
        setStartDate(value);
        handleSearch({
            keywordSearch,
            start_date: value ? formatDateISO(value) : "",
            end_date: endDate ? formatDateISO(endDate) : "",
        });
    };

    // =============== handle end date change for date range ================
    const handleEndDateChange = (value) => {
        form.setFieldValue("end_date", value ? formatDateISO(value) : "");
        setEndDate(value);
        handleSearch({
            keywordSearch,
            start_date: startDate ? formatDateISO(startDate) : "",
            end_date: value ? formatDateISO(value) : "",
        });
    };

    // =============== handle reset functionality ================
    const handleReset = () => {
        form.setFieldValue("keywordSearch", "");
        debouncedSetKeywordInForm.flush?.();

        form.setFieldValue("created", null);
        setKeywordSearch("");
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
    }

    return (
        <Flex gap="xs" className={className}>
            {showDatePicker && (
                <DateInput
                    clearable
                    name="created"
                    placeholder="Select Date"
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
                        placeholder="Start Date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        miw={200}
                    />
                    <DateInput
                        clearable
                        name="end_date"
                        placeholder="End Date"
                        value={endDate}
                        onChange={handleEndDateChange}
                        miw={200}
                    />
                </>
            )}
            <TextInput
                placeholder={placeholder}
                tooltip={tooltip}
                name="keywordSearch"
                value={keywordSearch}
                rightSection={
                    keywordSearch ? (
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
            <Flex gap="3xs" align="center">
                <ActionIcon
                    c="var(--theme-primary-color-6)"
                    bg="var(--mantine-color-white)"
                    onClick={() => handleSearch()}
                    bd="1px solid var(--theme-grey-color-1)"
                >
                    <IconSearch size={16} stroke={1.5} />
                </ActionIcon>

                {showReset && (
                    <ActionIcon
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
