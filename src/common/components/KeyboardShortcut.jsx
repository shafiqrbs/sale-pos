import { Box, Kbd } from "@mantine/core";
import { Fragment } from "react";

export default function KeyboardShortcut({ size = "xs", keys }) {
	return (
		<Box lh={0} component="span" display="inline-block" gap={4}>
			{keys.map((key, i) => (
				<Fragment key={i}>
					{i > 0 && (
						<Box fz={size} component="span" display="inline-block">
							+
						</Box>
					)}
					<Kbd size={size}>{key}</Kbd>
				</Fragment>
			))}
		</Box>
	);
}
