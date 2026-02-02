import { forwardRef } from "react";
import { Tooltip, Select } from "@mantine/core";
import inputCss from "@assets/css/InputField.module.css";

const SelectForm = forwardRef((props, ref) => {
	const {
		position,
		color,
		label,
		placeholder,
		required,
		nextField,
		name,
		form,
		tooltip,
		mt,
		id,
		dropdownValue = [],
		searchable,
		value,
		changeValue,
		style = {},
		clearable = true,
		allowDeselect = true,
		pt,
	} = props;

	const handleChange = async (e) => {
		if (changeValue) {
			changeValue(e);
		}

		form.setFieldValue(name, e);
		if (nextField) {
			setTimeout(() => {
				const nextElement = document.getElementById(nextField);
				if (nextElement) {
					nextElement.focus();
				}
			}, 0);
		}
	};

	return (
		<>
			{form && (
				<Tooltip
					label={tooltip}
					opened={name in form.errors && !!form.errors[ name ]}
					px={16}
					py={2}
					position={position && position ? position : "top-end"}
					bg={color && color ? color : "red.4"}
					c="white"
					withArrow
					offset={2}
					zIndex={999}
					transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
				>
				<Select
					pt={pt}
					classNames={inputCss}
					ref={ref}
					id={id}
					label={label}
					placeholder={placeholder}
					mt={mt}
					size="sm"
					data={dropdownValue}
					autoComplete="off"
					clearable={clearable}
					searchable={searchable}
					{...form.getInputProps(name)}
					{...(value !== undefined && { value })}
					onChange={handleChange}
					withAsterisk={required}
					comboboxProps={props.comboboxProps}
					allowDeselect={allowDeselect}
					style={style}
				/>
				</Tooltip>
			)}
		</>
	);
});

SelectForm.displayName = "SelectForm";

export default SelectForm;
