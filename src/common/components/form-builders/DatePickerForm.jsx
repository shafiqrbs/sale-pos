import { DateInput } from "@mantine/dates";
import { Tooltip } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { IconInfoCircle, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dayjs from "dayjs";

dayjs.extend(customParseFormat);

function DatePickerForm(props) {
	const {
		color = "var(--theme-error-color)",
		label,
		placeholder,
		required,
		nextField,
		name,
		form,
		tooltip,
		mt,
		id,
		closeIcon,
		valueFormat,
		minDate,
	} = props;
	const { t } = useTranslation();

	return (
		<>
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
					id={id}
					clearable
					size="sm"
					minDate={minDate ? dayjs(minDate).toDate() : undefined}
					label={label}
					placeholder={placeholder}
					valueFormat={valueFormat}
					mt={mt}
					autoComplete="off"
					dateParser={(input) => {
						const parsed = dayjs(input, ["DD-MM-YYYY", "D-M-YYYY", "DD-M-YYYY", "D-MM-YYYY"], true);
						return parsed.isValid() ? parsed.toDate() : null;
					}}
					value={form.values[name] || null}
					onChange={(value) => form.setFieldValue(name, value)}
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
					leftSection={props.leftSection}
					rightSection={
						form.values[name] && closeIcon ? (
							<Tooltip label={t("Close")} withArrow bg="red.1" c="red.3">
								<IconX
									color="red.5"
									size={16}
									opacity={0.5}
									onClick={() => {
										form.setFieldValue(name, "");
									}}
								/>
							</Tooltip>
						) : (
							<Tooltip
								label={tooltip}
								px={16}
								py={2}
								withArrow
								position="left"
								c="black"
								bg="gray.1"
								transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
							>
								{props.rightIcon ? (
									props.rightIcon
								) : (
									<IconInfoCircle size={16} opacity={0.5} color="inherit" />
								)}
							</Tooltip>
						)
					}
					withAsterisk={required}
				/>
			</Tooltip>
		</>
	);
}

export default DatePickerForm;
