import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router'
import { ScrollArea, Box, Text } from '@mantine/core'

export default function Categories({ filter, setFilter }) {
  const { mainAreaHeight } = useOutletContext()
  const [ categories, setCategories ] = useState([])

  useEffect(() => {
    async function fetchCategories() {
      const categories = await window.dbAPI.getDataFromTable("categories")
      setCategories(categories)
    }
    fetchCategories()
  }, [])

  return (
    <ScrollArea
      h={mainAreaHeight}
      type="never"
      scrollbars="y"
    >
      {categories?.map((category) => (
        <Box
          bdrs={4}
          mih={40}
          className='cursor-pointer user-none'
          mt="4"
          variant="default"
          key={category.id}
          onClick={() => {
            setFilter((previousFilter) => {
              const isCategorySelected = previousFilter?.categories?.includes(category.id);
              const updatedCategoryIds = isCategorySelected
                ? previousFilter?.categories?.filter((categoryId) => categoryId !== category.id)
                : [ ...previousFilter?.categories || [], category.id ];

              return {
                ...previousFilter,
                categories: updatedCategoryIds,
              };
            });
          }}
          bg={filter?.categories?.includes(category.id) ? "green.8" : "gray.8"}
        >
          <Text
            size="md"
            pl={14}
            pt="3xs"
            fw={500}
            c="white"
          >
            {category.name}
          </Text>
        </Box>
      ))}
    </ScrollArea>
  )
}
