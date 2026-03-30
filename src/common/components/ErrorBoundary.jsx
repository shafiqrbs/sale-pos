import { Component } from "react";
import { Button, Center, Stack, Text, Title } from "@mantine/core";

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		console.error("ErrorBoundary caught:", error, errorInfo);
	}

	handleReload = () => {
		this.setState({ hasError: false, error: null });
		window.location.hash = "#/";
		window.location.reload();
	};

	handleGoBack = () => {
		this.setState({ hasError: false, error: null });
		window.history.back();
	};

	render() {
		if (this.state.hasError) {
			return (
				<Center h="100vh">
					<Stack align="center" gap="md">
						<Title order={3}>Something went wrong</Title>
						<Text c="dimmed" size="sm" maw={400} ta="center">
							An unexpected error occurred. You can try going back or reloading the
							application.
						</Text>
						<Stack direction="row" gap="sm">
							<Button variant="light" onClick={this.handleGoBack}>
								Go Back
							</Button>
							<Button onClick={this.handleReload}>Reload App</Button>
						</Stack>
					</Stack>
				</Center>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
