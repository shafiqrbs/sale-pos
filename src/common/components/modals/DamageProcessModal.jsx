import { useState, useEffect } from "react";
import { Table, NumberInput, Button, Text, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import GlobalModal from "./GlobalModal";
import { useProcessDamageMutation } from "@services/purchase";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import { formatCurrency } from "@utils/index.js";

export default function DamageProcessModal({
	opened,
	onClose,
	product,
	damageItems,
	loading,
	onSuccess,
}) {
	const { t } = useTranslation();
	const [quantities, setQuantities] = useState({});
	const [processDamage, { isLoading: isProcessing }] = useProcessDamageMutation();

	useEffect(() => {
		if (opened && damageItems?.length) {
			const initial = {};
			damageItems.forEach((item) => {
				initial[item.purchase_item_id] = 0;
			});
			setQuantities(initial);
		}
	}, [opened, damageItems]);

	const handleQuantityChange = (purchaseItemId, value) => {
		setQuantities((prev) => ({
			...prev,
			[purchaseItemId]: value || 0,
		}));
	};

	const hasAnyQuantity = Object.values(quantities).some((qty) => qty > 0);

	const handleSubmit = async () => {
		const data = damageItems
			.filter((item) => quantities[item.purchase_item_id] > 0)
			.map((item) => ({
				purchase_item_id: item.purchase_item_id,
				damage_quantity: quantities[item.purchase_item_id],
				subtotal: quantities[item.purchase_item_id] * item.purchase_price,
			}));

		try {
			const response = await processDamage({
				id: product?.id,
				body: {
					item_nature_type: product?.item_nature || "Stockable",
					data,
				},
			}).unwrap();

			if (response?.status === 200) {
				showNotification(t("DamageProcessedSuccessfully"), "teal");
				onSuccess?.();
				onClose();
			} else {
				showNotification(response?.message || t("DamageProcessFailed"), "red");
			}
		} catch {
			showNotification(t("DamageProcessFailed"), "red");
		}
	};

	const title = (
		<>
			<b>{t("DamageProcess")}</b>
			{` :: ${product?.product_name || ""} (${product?.item_nature || "Stockable"} ${t("Item")})`}
		</>
	);

	return (
		<GlobalModal
			opened={opened}
			onClose={onClose}
			title={title}
			size="90%"
			loading={loading || isProcessing}
			centered={false}
		>
			<Table striped highlightOnHover withTableBorder withColumnBorders>
				<Table.Thead>
					<Table.Tr>
						<Table.Th>{t("S/N")}</Table.Th>
						<Table.Th>{t("CreatedDate")}</Table.Th>
						<Table.Th>{t("Invoice")}</Table.Th>
						<Table.Th>{t("Name")}</Table.Th>
						<Table.Th>{t("RemainingQty")}</Table.Th>
						<Table.Th>{t("DamageQty")}</Table.Th>
						<Table.Th>{t("Price")}</Table.Th>
						<Table.Th>{t("SubTotal")}</Table.Th>
					</Table.Tr>
				</Table.Thead>
				<Table.Tbody>
					{damageItems?.map((item, index) => {
						const qty = quantities[item.purchase_item_id] || 0;
						const subtotal = qty * item.purchase_price;

						return (
							<Table.Tr key={item.purchase_item_id}>
								<Table.Td>{index + 1}</Table.Td>
								<Table.Td>{item.created_date}</Table.Td>
								<Table.Td>{item.invoice}</Table.Td>
								<Table.Td>{item.name}</Table.Td>
								<Table.Td>{item.remaining_quantity}</Table.Td>
								<Table.Td>
									<NumberInput
										min={0}
										max={item.remaining_quantity}
										step={1}
										clampBehavior="strict"
										value={qty}
										onChange={(value) => handleQuantityChange(item.purchase_item_id, value)}
										size="xs"
										w={100}
									/>
								</Table.Td>
								<Table.Td>{formatCurrency(item.purchase_price)}</Table.Td>
								<Table.Td>{formatCurrency(subtotal)}</Table.Td>
							</Table.Tr>
						);
					})}
					{(!damageItems || damageItems.length === 0) && (
						<Table.Tr>
							<Table.Td colSpan={8}>
								<Text ta="center" c="dimmed" py="md">
									{t("NoDataAvailable")}
								</Text>
							</Table.Td>
						</Table.Tr>
					)}
				</Table.Tbody>
			</Table>
			<Group justify="flex-end" mt="md">
				<Button onClick={handleSubmit} disabled={!hasAnyQuantity} loading={isProcessing}>
					{t("Submit")}
				</Button>
			</Group>
		</GlobalModal>
	);
}
