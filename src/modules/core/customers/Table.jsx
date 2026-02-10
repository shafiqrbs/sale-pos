import { useState } from "react";
import { useForm } from "@mantine/form";
import { Group, Box, ActionIcon, Text, Menu, rem, Flex, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconTrashX, IconDotsVertical, IconPlus } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { modals } from "@mantine/modals";
import tableCss from "@assets/css/Table.module.css";
import ViewDrawer from "./ViewDrawer.jsx";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import useGetCoreCustomers from "@hooks/useGetCoreCustomers";
import { useDeleteCustomerMutation, useGetCustomersQuery } from "@services/core/customer.js";
import KeywordSearch from "@components/KeywordSearch";
import { useDisclosure } from "@mantine/hooks";
import CustomerCreateModal from "./form/Create.jsx";
import CustomerUpdateModal from "./form/Update.jsx";

const PER_PAGE = 25;

export default function Table() {
	const [ deleteCustomer, { isLoading: isCustomerDeleting } ] = useDeleteCustomerMutation();
	const [ page, setPage ] = useState(1);

	const filterForm = useForm({
		initialValues: {
			term: "",
			name: "",
			mobile: "",
		},
	});

	const { data: customers, isLoading, refetch } = useGetCustomersQuery({
		...filterForm.values,
		page,
		offset: PER_PAGE,
	});

	const { coreCustomers } = useGetCoreCustomers();
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const height = mainAreaHeight - 102;

	const [ customerObject, setCustomerObject ] = useState({});
	const [ viewDrawer, { open: openViewDrawer, close: closeViewDrawer } ] = useDisclosure(false);
	const [ createModal, { open: openCreateModal, close: closeCreateModal } ] = useDisclosure(false);
	const [ updateModal, { open: openUpdateModal, close: closeUpdateModal } ] = useDisclosure(false);
	const [ selectedCustomer, setSelectedCustomer ] = useState(null);

	const handleShowData = (data) => {
		const foundCustomers = coreCustomers.find((customer) => customer.id == data.id);
		if (foundCustomers) {
			setCustomerObject(foundCustomers);
			openViewDrawer();
		} else {
			showNotification(
				t("Something Went wrong , please try again"),
				"red",
				"",
				"",
				false,
				900,
				true
			);
		}
	};

	const handleDeleteCustomer = (id) => {
		modals.openConfirmModal({
			title: <Text size="md"> {t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm"> {t("FormConfirmationMessage")}</Text>,
			confirmProps: { color: "red.6" },
			labels: { confirm: "Confirm", cancel: "Cancel" },
			onCancel: () => console.log("Cancel"),
			onConfirm: async () => {
				const response = await deleteCustomer(id);
				if (response.data) {
					showNotification(t("DeleteSuccessfully"), "green");
				} else {
					showNotification(t("DeleteFailed"), "red");
				}
			},
		})
	};


	const selectEditCustomer = (data) => {
		const foundCustomer = coreCustomers.find((customer) => customer.id == data.id);

		if (foundCustomer) {
			setSelectedCustomer(foundCustomer);
			openUpdateModal();
		} else {
			showNotification(
				t("Something Went wrong , please try again"),
				"red",
				"",
				"",
				false,
				900,
				true
			);
		}
	}

	return (
		<>
			<Flex gap="sm" mb="2xs" justify="space-between" align="center">
				<KeywordSearch form={filterForm} />
				<Button
					leftSection={<IconPlus size={16} stroke={1.5} />}
					color="white"
					bg="var(--theme-primary-color-6)"
					w="100px"
					onClick={openCreateModal}
				>
					{t("Add")}
				</Button>
			</Flex>
			<Box className="border-all-radius border-top-none overflow-hidden">
				<DataTable
					classNames={{
						root: tableCss.root,
						table: tableCss.table,
						header: tableCss.header,
						footer: tableCss.footer,
						pagination: tableCss.pagination,
					}}
					records={customers?.data || []}
					onRowClick={(row) => handleShowData(row.record)}
					columns={[
						{
							accessor: "index",
							title: t("S/N"),
							textAlignment: "right",
							render: (item) => customers?.data?.indexOf(item) + 1,
						},
						{ accessor: "id", title: t("ID"), width: 100 },
						{ accessor: "name", title: t("Name"), width: 200 },
						{ accessor: "mobile", title: t("Mobile"), width: 200 },
						{ accessor: "customer_group", title: t("CustomerGroup") },
						{ accessor: "credit_limit", title: t("CreditLimit") },
						{ accessor: "discount_percent", title: t("Discount") + " %" },
						{
							accessor: "action",
							title: t("Action"),
							textAlign: "right",
							render: (data) => (
								<Group
									onClick={(e) => e.stopPropagation()}
									gap={4}
									justify="right"
									wrap="nowrap"
								>
									<Menu
										position="bottom-end"
										offset={3}
										withArrow
										trigger="hover"
										openDelay={100}
										closeDelay={400}
									>
										<Menu.Target>
											<ActionIcon
												size="sm"
												variant="outline"
												color="var(--theme-primary-color-6)"
												radius="xl"
												aria-label="Settings"
											>
												<IconDotsVertical height={"16"} width={"16"} stroke={1.5} />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>
											<Menu.Item
												onClick={() => handleShowData(data)}
												w={"200"}
											>
												{t("Show")}
											</Menu.Item>
											<Menu.Item
												onClick={() => selectEditCustomer(data)}
												w={"200"}
											>
												{t("Edit")}
											</Menu.Item>
											<Menu.Item
												w={"200"}
												mt={"2"}
												bg={"red.1"}
												c={"red.6"}
												onClick={() => handleDeleteCustomer(data.id)}
												rightSection={<IconTrashX style={{ width: rem(14), height: rem(14) }} />}
											>
												{t("Delete")}
											</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								</Group>
							),
						},
					]}
					fetching={isLoading || isCustomerDeleting}
					totalRecords={customers?.total || 0}
					recordsPerPage={PER_PAGE}
					page={page}
					onPageChange={setPage}
					loaderSize="xs"
					loaderColor="grape"
					height={height}
					scrollAreaProps={{ type: "never" }}
				/>
			</Box>

			<ViewDrawer opened={viewDrawer} onClose={closeViewDrawer} data={customerObject} />

			<CustomerCreateModal
				opened={createModal}
				onClose={closeCreateModal}
			/>

			<CustomerUpdateModal
				opened={updateModal}
				onClose={closeUpdateModal}
				entityEditData={selectedCustomer}
			/>
		</>
	);
}
