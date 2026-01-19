import { PasswordInput, Tooltip } from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";

function PasswordInputForm(props) {
	const { label, placeholder, required, nextField, name, form, tooltip, mt, id } = props;

	return (
		<>
			{form && (
				<Tooltip
					label={tooltip}
					opened={name in form.errors && !!form.errors[name]}
					px={16}
					py={2}
					position="top-end"
					bg={`red.4`}
					c={"white"}
					withArrow
					offset={2}
					zIndex={0}
					transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
				>
					<PasswordInput
						id={id}
						size="sm"
						label={label}
						placeholder={placeholder}
						mt={mt}
						{...form.getInputProps(name && name)}
						onKeyDown={getHotkeyHandler([
							[
								"Enter",
								() => {
									document.getElementById(nextField).focus();
								},
							],
						])}
						autoComplete={"off"}
						withAsterisk={required}
						inputWrapperOrder={["label", "input", "description"]}
					/>
				</Tooltip>
			)}
		</>
	);
}

export default PasswordInputForm;
