import { Modal, Text, Box, Group, ActionIcon, Button, ScrollArea, Divider } from "@mantine/core";
import { IconPlus, IconMinus } from "@tabler/icons-react";
import { useState, useEffect } from "react";

export default function BatchProductModal({ opened, close, purchaseItems, currentBatches, productName, onBatchSelect }) {
    const [ selectedBatches, setSelectedBatches ] = useState({});

    // =============== initialize with current batches from cart ================
    useEffect(() => {
        if (opened && currentBatches) {
            const batchesObject = {};
            currentBatches.forEach(batch => {
                batchesObject[ batch.id ] = batch.quantity;
            });
            setSelectedBatches(batchesObject);
        } else if (!opened) {
            // =============== reset when modal closes ================
            setSelectedBatches({});
        }
    }, [ opened, currentBatches ]);

    // =============== handle quantity change for a batch ================
    const handleQuantityChange = (purchaseItemId, change) => {
        setSelectedBatches(previous => {
            const currentQuantity = previous[ purchaseItemId ] || 0;
            const newQuantity = Math.max(0, currentQuantity + change);

            if (newQuantity === 0) {
                const { [ purchaseItemId ]: _, ...rest } = previous;
                return rest;
            }

            return { ...previous, [ purchaseItemId ]: newQuantity };
        });
    };

    // =============== handle update cart ================
    const handleUpdateCart = () => {
        const batchArray = Object.entries(selectedBatches).map(([ purchaseItemId, quantity ]) => ({
            id: parseInt(purchaseItemId),
            quantity: quantity
        }));

        onBatchSelect(batchArray);
        close();
    };

    const handleCancel = () => {
        close();
    };

    const totalQuantity = Object.values(selectedBatches).reduce((sum, quantity) => sum + quantity, 0);
    const isUpdateMode = currentBatches?.length > 0;
    const isUpdateCartDisabled = isUpdateMode && totalQuantity === 0;

    return (
        <Modal
            opened={opened}
            onClose={handleCancel}
            title={`Select from: ${productName || 'Batch'}`}
            size="lg"
            centered
        >
            <ScrollArea h={400}>
                <Box>
                    {purchaseItems?.length > 0 ? (
                        purchaseItems.map((item, index) => (
                            <Box key={item.purchase_item_id || index}>
                                <Group justify="space-between" py="md">
                                    <Box>
                                        <Text size="sm" fw={600}>
                                            Batch #{item.purchase_item_id}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            Available: {item.remain_quantity} | Expires: {item.expired_date}
                                        </Text>
                                    </Box>
                                    <Group gap={8}>
                                        <ActionIcon
                                            size="md"
                                            variant="filled"
                                            color="gray.7"
                                            disabled={(selectedBatches[ item.purchase_item_id ] || 0) === 0}
                                            onClick={() => handleQuantityChange(item.purchase_item_id, -1)}
                                        >
                                            <IconMinus height={16} width={16} />
                                        </ActionIcon>
                                        <Text size="sm" ta="center" fw={600} miw={30}>
                                            {selectedBatches[ item.purchase_item_id ] || 0}
                                        </Text>
                                        <ActionIcon
                                            size="md"
                                            variant="filled"
                                            color="gray.7"
                                            disabled={(selectedBatches[ item.purchase_item_id ] || 0) >= item.remain_quantity}
                                            onClick={() => handleQuantityChange(item.purchase_item_id, 1)}
                                        >
                                            <IconPlus height={16} width={16} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                                {index < purchaseItems.length - 1 && <Divider />}
                            </Box>
                        ))
                    ) : (
                        <Text ta="center" c="dimmed" py="xl">
                            No batches available
                        </Text>
                    )}
                </Box>
            </ScrollArea>

            <Group justify="flex-end" mt="md" gap="xs">
                <Button variant="subtle" color="gray" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleUpdateCart}
                    disabled={isUpdateCartDisabled}
                >
                    {currentBatches?.length > 0 ? "Update Cart" : "Add to Cart"}
                </Button>
            </Group>
        </Modal>
    );
}
