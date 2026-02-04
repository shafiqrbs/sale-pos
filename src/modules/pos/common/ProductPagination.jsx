import { Pagination, Flex, Box } from '@mantine/core';

export default function ProductPagination({
    activePage,
    totalItems,
    itemsPerPage,
    onPageChange,
}) {
    const totalPages = Math.max(1, Math.ceil((totalItems || 0) / (itemsPerPage || 1)));

    if (totalPages <= 1) {
        return null;
    }

    return (
        <Box
            pos='absolute'
            bottom={9}
            left={9}
            right={9}
            bg='gray.8'
            style={{
                boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
            }}
        >
            <Flex justify="center" align="center" bg="white" py="xs" w="100%" h="100%" style={{ borderBottomRightRadius: '6px', borderBottomLeftRadius: '6px', overflow: 'hidden' }}>
                <Pagination
                    value={activePage}
                    onChange={onPageChange}
                    total={totalPages}
                    radius="sm"
                    size="md"
                    withEdges
                />
            </Flex>
        </Box>
    );
}

