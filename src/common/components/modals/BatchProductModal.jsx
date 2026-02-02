import { Modal, Text, Box, Group, ActionIcon, Button, ScrollArea, Divider, NumberInput } from "@mantine/core";
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

    // =============== handle direct quantity input for a batch ================
    const handleDirectQuantityChange = (purchaseItemId, value, maxQuantity) => {
        setSelectedBatches(previous => {
            const numericValue = parseFloat(value) || 0;
            const newQuantity = Math.min(Math.max(0, numericValue), maxQuantity);

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

    // =============== add/update cart requires at least 1 quantity from any batch ================
    const totalQuantity = Object.values(selectedBatches).reduce((sum, quantity) => sum + quantity, 0);
    const isAddOrUpdateCartDisabled = totalQuantity === 0;

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
                                        <NumberInput
                                            size="xs"
                                            ta="center"
                                            fw={600}
                                            w={60}
                                            value={selectedBatches[ item.purchase_item_id ] || 0}
                                            min={0}
                                            allowNegative={false}
                                            max={item.remain_quantity}
                                            step={1}
                                            decimalScale={3}
                                            hideControls
                                            onChange={(value) => {
                                                handleDirectQuantityChange(item.purchase_item_id, value, item.remain_quantity);
                                            }}
                                            styles={{
                                                input: {
                                                    textAlign: 'center',
                                                    fontWeight: 600,
                                                    padding: '0 2px'
                                                }
                                            }}
                                        />
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
                    disabled={isAddOrUpdateCartDisabled}
                >
                    {currentBatches?.length > 0 ? "Update Cart" : "Add to Cart"}
                </Button>
            </Group>
        </Modal>
    );
}
