import {
	Box,
	Button,
	Container,
	Group,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Code,
	ScrollArea,
	Divider,
} from "@mantine/core";
import { IconAlertTriangle, IconHome, IconRefresh } from "@tabler/icons-react";

export default function ErrorFallback({ error, resetErrorBoundary }) {

	function handleReload() {
		resetErrorBoundary();
	}

	function handleGoHome() {
		resetErrorBoundary();
	}

	return (
		<Container size="sm" h="100vh" display="flex" style={{ alignItems: "center", justifyContent: "center" }}>
			<Stack align="center" gap="xl" w="100%">
				<ThemeIcon size={72} radius="xl" color="red" variant="light">
					<IconAlertTriangle size={40} stroke={1.5} />
				</ThemeIcon>

				<Box ta="center">
					<Title order={2} c="red.7" mb="xs">
						Something went wrong
					</Title>
					<Text c="dimmed" size="md" maw={480} mx="auto">
						An unexpected error occurred while rendering this part of the application.
						You can try to recover by clicking the button below.
					</Text>
				</Box>

				{error?.message && (
					<Box w="100%" maw={520}>
						<Divider label="Error details" labelPosition="center" mb="sm" />
						<ScrollArea h={100} type="hover">
							<Code block fz="xs" c="red.8" bg="red.0" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
								{error.message}
							</Code>
						</ScrollArea>
					</Box>
				)}

				<Group justify="center" gap="md">
					<Button
						leftSection={<IconRefresh size={16} />}
						variant="filled"
						color="indigo"
						onClick={handleReload}
					>
						Try again
					</Button>
					<Button
						leftSection={<IconHome size={16} />}
						variant="light"
						color="gray"
						onClick={handleGoHome}
					>
						Go to Home
					</Button>
				</Group>
			</Stack>
		</Container>
	);
}
