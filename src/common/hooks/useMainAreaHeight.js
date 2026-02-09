import { useViewportSize } from "@mantine/hooks";

const useMainAreaHeight = () => {
	const { height } = useViewportSize();

	const headerHeight = 42;
	const footerHeight = 58;
	const padding = 0;
	const mainAreaHeight = height - headerHeight - footerHeight - padding;

	return { mainAreaHeight, headerHeight, footerHeight, padding };
};

export default useMainAreaHeight;
