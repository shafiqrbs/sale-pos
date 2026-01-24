import React from 'react'
import { useOutletContext } from 'react-router'
import useGetCategories from '@hooks/useGetCategories'
import { ScrollArea, Box, Text } from '@mantine/core'

export default function Categories({ id }) {
  const { isOnline, mainAreaHeight } = useOutletContext()
  const { categories } = useGetCategories({ offlineFetch: !isOnline })

  return (
    <ScrollArea
      h={mainAreaHeight}
      type="never"
      scrollbars="y"
    >
      {categories?.map((data) => (
        <Box
          style={{
            borderRadius: 4,
          }}
          mih={40}
          className='cursor-pointer'
          mt={"4"}
          variant="default"
          key={data.id}
          // onClick={() => {
          //     filterProductsbyCategory(data.value);
          // }}
          bg={data.id === id ? "green.8" : "gray.8"}
        >
          <Text
            size={"md"}
            pl={14}
            pt="3xs"
            fw={500}
            c="white"
          >
            {data.name}
          </Text>
        </Box>
      ))}
    </ScrollArea>
  )
}
