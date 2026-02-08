import { useEffect, useState, useMemo } from "react"
import { Stack, Text, Group, NumberInput, Button, Box, Image, Flex, Divider, ScrollArea } from "@mantine/core"
import { useTranslation } from "react-i18next"
import useConfigData from "@hooks/useConfigData"
import { useOutletContext } from "react-router"
import GlobalDrawer from "./GlobalDrawer"

export default function SplitPaymentsDrawer({ opened, onClose, totalAmount, onSave, onRemove, existingSplitPayments = [] }) {
    const { t } = useTranslation()
    const { isOnline, mainAreaHeight } = useOutletContext()
    const { configData } = useConfigData({ offlineFetch: !isOnline })
    const [ methods, setMethods ] = useState([])

    const initialPayments = useMemo(() => {
        const payments = {}
        if (existingSplitPayments.length > 0) {
            existingSplitPayments.forEach(payment => {
                payments[ payment.transaction_mode_id ] = payment.amount
            })
        }
        return payments
    }, [ existingSplitPayments ])

    const [ paymentInputs, setPaymentInputs ] = useState(initialPayments)

    useEffect(() => {
        async function fetchMethods() {
            const data = await window.dbAPI.getDataFromTable("accounting_transaction_mode")
            setMethods(data)
        }
        fetchMethods()
    }, []);

    useEffect(() => {
        setPaymentInputs(initialPayments)
    }, [ initialPayments ])

    const totalEnteredAmount = Object.values(paymentInputs).reduce((sum, value) => {
        return sum + (parseFloat(value) || 0)
    }, 0)

    const dueAmount = totalAmount - totalEnteredAmount;

    // =============== check if save button should be enabled ================
    const isSaveDisabled = totalEnteredAmount < totalAmount

    // =============== handle input change for a specific method ================
    const handleInputChange = (methodId, value) => {
        setPaymentInputs(prevInputs => ({
            ...prevInputs,
            [ methodId ]: value
        }))
    }

    // =============== handle save button click ================
    const handleSaveClick = () => {
        const splitPayments = methods
            .filter(method => paymentInputs[ method.id ] && parseFloat(paymentInputs[ method.id ]) > 0)
            .map(method => ({
                transaction_mode_id: method.id,
                mode_name: method.name,
                amount: parseFloat(paymentInputs[ method.id ])
            }))

        onSave(splitPayments)
        onClose()
    }

    // =============== handle remove button click ================
    const handleRemoveClick = () => {
        onRemove()
        onClose()
    }

    return (
        <GlobalDrawer
            opened={opened}
            onClose={onClose}
            title={t("SplitPayments")}
            position="right"
            size="md"
        >
            <Box>
                <Stack gap="md">
                    <Divider />
                    <Box>
                        <Group justify="space-between" mb="xs">
                            <Text size="lg" fw={600}>{t("Total")}</Text>
                            <Text size="lg" fw={700} c="var(--theme-primary-color-6)">
                                {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol} {totalAmount?.toFixed(2)}
                            </Text>
                        </Group>
                        <Group justify="space-between">
                            <Text size="md" fw={500}>{t("Due")}</Text>
                            <Text size="md" fw={600} c={dueAmount > 0 ? "red" : "green"}>
                                {configData?.currency?.symbol || configData?.inventory_config?.currency?.symbol} {dueAmount?.toFixed(2)}
                            </Text>
                        </Group>
                    </Box>

                    <Divider />
                    <ScrollArea h={mainAreaHeight - 164}>
                        {/* =============== payment methods section ================ */}
                        <Stack gap="sm">
                            {methods?.map((method) => (
                                <Flex key={method.id} align="center" gap="md">
                                    <Image
                                        w={60}
                                        fit="contain"
                                        alt={method.name}
                                        src={method.path}
                                        border="1px solid #2f9e44"
                                        radius="sm"
                                        fallbackSrc={`https://placehold.co/60x60/FFFFFF/2f9e44?text=${method.name}`}
                                    />
                                    <Text size="sm" fw={500} style={{ minWidth: "100px" }}>
                                        {method.name}
                                    </Text>
                                    <NumberInput
                                        placeholder={t("Amount")}
                                        value={paymentInputs[ method.id ] || ""}
                                        onChange={(value) => handleInputChange(method.id, value)}
                                        allowNegative={false}
                                        decimalScale={2}
                                        hideControls
                                        size="sm"
                                        style={{ flex: 1 }}
                                        min={0}
                                    />
                                </Flex>
                            ))}
                        </Stack>
                    </ScrollArea>
                </Stack>

                <Divider />
                {/* =============== action buttons ================ */}
                <Group justify="space-between" mt="md">
                    <Button variant="outline" onClick={onClose}>
                        {t("Close")}
                    </Button>
                    <Group>
                        {existingSplitPayments.length > 0 && (
                            <Button
                                onClick={handleRemoveClick}
                                color="red"
                                variant="outline"
                            >
                                {t("CancelSplit")}
                            </Button>
                        )}
                        <Button
                            onClick={handleSaveClick}
                            disabled={isSaveDisabled}
                            color="green"
                        >
                            {t("Save")}
                        </Button>
                    </Group>
                </Group>
            </Box>
        </GlobalDrawer>
    )
}
