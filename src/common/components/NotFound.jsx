import { Box, Container, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export default function NotFound() {
	return (
		<Container size="sm" py="xl" h="100vh" display="grid" style={{ placeItems: "center" }}>
			<Box>
				<Title order={1} align="center">
					404 - Page Not Found
				</Title>
				<Text align="center" size="lg" weight={500} mt="md">
					The page you are looking for does not exist.
				</Text>
				<Text align="center" size="lg" weight={500} mt="md">
					<Link to="/">Go to Home</Link>
				</Text>
			</Box>
		</Container>
	);
}
