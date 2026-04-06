import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { ScrollArea, Box, Text, Group } from "@mantine/core";

export default function Categories({ filter, setFilter }) {
	const { mainAreaHeight } = useOutletContext();
	const [categories, setCategories] = useState([]);

	useEffect(() => {
		async function fetchCategories() {
			const categories = await window.dbAPI.getDataFromTable("categories");
			setCategories(categories);
		}
		fetchCategories();
	}, []);

	return (
		<ScrollArea h={mainAreaHeight} type="never" scrollbars="y">
			{categories?.map((category) => (
				<Box
					bdrs={4}
					mih={40}
					className="cursor-pointer user-none"
					mt="4"
					variant="default"
					key={category.id}
					onClick={() => {
						setFilter((previousFilter) => {
							const isCategorySelected = previousFilter?.categories?.includes(category.id);
							const updatedCategoryIds = isCategorySelected
								? previousFilter?.categories?.filter((categoryId) => categoryId !== category.id)
								: [...(previousFilter?.categories || []), category.id];

							return {
								...previousFilter,
								categories: updatedCategoryIds,
							};
						});
					}}
					bg={filter?.categories?.includes(category.id) ? "green.8" : "gray.8"}
				>
					<Group gap={6} wrap="nowrap" pl={14} pt="3xs" pr={10} align="center">
						<Text size="md" fw={500} c="#dad6d6" style={{ flex: 1 }}>
							{category.name}
						</Text>
						{category.item > 0 && (
							<Text
								size="xs"
								fw={700}
								c={filter?.categories?.includes(category.id) ? "white" : "gray.5"}
								bg={filter?.categories?.includes(category.id) ? "green.6" : "dark.5"}
								px={8}
								py={2}
								style={{ borderRadius: 10, minWidth: 22, textAlign: "center", lineHeight: 1.4 }}
							>
								{category.item}
							</Text>
						)}
					</Group>
				</Box>
			))}
		</ScrollArea>
	);
}
