import { Component } from "react";
import { Button, Center, Stack, Text, Title } from "@mantine/core";

/**
 * ErrorBoundary — prevents the entire app from crashing when a component throws.
 *
 * Without this, a single rendering error in any component (e.g. a null reference
 * in the POS checkout, a bad API response in dashboard) would show a blank white
 * screen with no way to recover — the user would have to force-quit the app.
 *
 * This catches those errors and shows a recovery UI with "Go Back" and "Reload"
 * options, so the user can continue working without losing their session.
 *
 * Wraps all routes in App.jsx so every page is protected.
 */
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
