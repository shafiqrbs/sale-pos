import { DateInput } from "@mantine/dates";
import { Tooltip } from "@mantine/core";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";
import { getHotkeyHandler } from "@mantine/hooks";

dayjs.extend(customParseFormat);

function DateInputForm(props) {
	const {
		label,
		tooltip,
		color = "var(--theme-error-color)",
		form,
		name,
		minDate,
		id,
		placeholder = "DD-MM-YYYY",
		valueFormat = "DD-MM-YYYY",
		clearable = true,
		nextField,
		...restProps
	} = props;

	return (
		<Tooltip
			label={tooltip}
			opened={name in form.errors && !!form.errors[name]}
			px={16}
			py={2}
			position="top-end"
			bg={color}
			c={"white"}
			withArrow
			offset={2}
			zIndex={999}
			transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
		>
			<DateInput
				id={id ?? name}
				label={label}
				placeholder={placeholder}
				valueFormat={valueFormat}
				clearable={clearable}
				value={
					form.values[name] && dayjs(form.values[name]).isValid()
						? dayjs(form.values[name]).toDate()
						: null
				}
				minDate={minDate ? dayjs(minDate).toDate() : undefined}
				onChange={(dateValue) => form.setFieldValue(name, dateValue)}
				error={form.errors[name]}
				onKeyDown={getHotkeyHandler([
					[
						"Enter",
						() => {
							nextField === "EntityFormSubmit"
								? document.getElementById(nextField).click()
								: document.getElementById(nextField).focus();
						},
					],
				])}
				{...restProps}
			/>
		</Tooltip>
	);
}

export default DateInputForm;
