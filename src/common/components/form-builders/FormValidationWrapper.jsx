import { Tooltip } from "@mantine/core";

export default function FormValidationWrapper({ errorMessage, opened, position = "top-end", children }) {
  return (
    <Tooltip
      label={errorMessage ? errorMessage : opened}
      opened={!!opened}
      px={16}
      py={2}
      position={position}
      bg="var(--theme-error-color)"
      c="white"
      withArrow
      offset={2}
      zIndex={999}
      transitionProps={{ transition: "pop-bottom-left", duration: 500 }}
    >
      {children}
    </Tooltip>
  );
}