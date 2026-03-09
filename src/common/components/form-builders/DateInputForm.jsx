import { DateInput } from "@mantine/dates";
import { Tooltip } from "@mantine/core";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";

dayjs.extend(customParseFormat);

function DateInputForm(props) {
	const {
		tooltip,
		color = "var(--theme-error-color)",
		form,
		name,
		minDate,
		id,
		placeholder = "DD-MM-YYYY",
		valueFormat = "DD-MM-YYYY",
		clearable = true,
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
				{...restProps}
			/>
		</Tooltip>
	);
}

export default DateInputForm;
