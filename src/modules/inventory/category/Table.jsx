import { useState } from "react";
import { useForm } from "@mantine/form";
import { Group, Box, ActionIcon, Text, Menu, rem, Flex, Button } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { IconTrashX, IconDotsVertical, IconPlus, IconReload } from "@tabler/icons-react";
import { DataTable } from "mantine-datatable";
import { modals } from "@mantine/modals";
import { useDisclosure } from "@mantine/hooks";
import tableCss from "@assets/css/Table.module.css";
import KeywordSearch from "@components/KeywordSearch";
import useMainAreaHeight from "@hooks/useMainAreaHeight.js";
import { showNotification } from "@components/ShowNotificationComponent.jsx";
import {
	useGetCategoryByIdQuery,
	useDeleteCategoryMutation,
	useGetFullCategoriesQuery,
} from "@services/category.js";
import CategoryViewDrawer from "@components/drawers/CategoryViewDrawer.jsx";
import CategoryCreateDrawer from "./form/Create.jsx";
import CategoryUpdateDrawer from "./form/Update.jsx";

const PER_PAGE = 50;

export default function Table() {
	const { t } = useTranslation();
	const { mainAreaHeight } = useMainAreaHeight();
	const height = mainAreaHeight - 48;

	const [page, setPage] = useState(1);
	const [categoryId, setCategoryId] = useState(null);

	const filterForm = useForm({
		initialValues: {
			term: "",
			name: "",
			parent: "",
		},
	});

	const {
		data: categories,
		isLoading,
		isFetching,
		refetch,
	} = useGetFullCategoriesQuery({
		...filterForm.values,
		page,
		offset: PER_PAGE,
	});

	const {
		data: category,
		isLoading: isCategoryLoading,
		isFetching: isCategoryFetching,
	} = useGetCategoryByIdQuery(categoryId, {
		skip: !categoryId,
	});

	const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation();

	const [viewDrawer, { open: openViewDrawer, close: closeViewDrawer }] = useDisclosure(false);
	const [createDrawer, { open: openCreateDrawer, close: closeCreateDrawer }] = useDisclosure(false);
	const [updateDrawer, { open: openUpdateDrawer, close: closeUpdateDrawer }] = useDisclosure(false);

	const handleShowData = (data) => {
		setCategoryId(data.id);
		openViewDrawer();
	};

	const handleEditCategory = (data) => {
		setCategoryId(data.id);
		openUpdateDrawer();
	};

	const handleDeleteCategory = (id) => {
		modals.openConfirmModal({
			title: <Text size="md">{t("FormConfirmationTitle")}</Text>,
			children: <Text size="sm">{t("FormConfirmationMessage")}</Text>,
			confirmProps: { color: "red.6" },
			labels: { confirm: t("Confirm"), cancel: t("Cancel") },
			onConfirm: async () => {
				try {
					const response = await deleteCategory(id);
					if (response.data) {
						showNotification(t("DeleteSuccessfully"), "green");
					} else {
						showNotification(t("DeleteFailed"), "red");
					}
				} catch (error) {
					console.error(error);
					showNotification(t("DeleteFailed"), "red");
				}
			},
		});
	};

	return (
		<>
			<Flex gap="sm" mb="2xs" justify="space-between" align="center">
				<KeywordSearch form={filterForm} />
				<ActionIcon
					bg="var(--theme-secondary-color-6)"
					onClick={refetch}
					disabled={isLoading || isFetching}
					aria-label="Refresh"
				>
					<IconReload size={16} stroke={1.5} />
				</ActionIcon>
				<Button
					leftSection={<IconPlus size={16} stroke={1.5} />}
					color="white"
					bg="red"
					w="180px"
					onClick={openCreateDrawer}
				>
					{t("AddCategory")}
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
					records={categories?.data || []}
					onRowClick={(row) => handleShowData(row.record)}
					columns={[
						{
							accessor: "index",
							title: t("S/N"),
							textAlignment: "right",
							render: (item) => (categories?.data?.indexOf(item) ?? 0) + 1 + (page - 1) * PER_PAGE,
						},
						{ accessor: "parent_name", title: t("ParentName") },
						{ accessor: "name", title: t("Name") },
						{ accessor: "generate_id", title: t("Code") },
						{ accessor: "expiry_duration", title: t("ExpiryDuration") },
						{
							accessor: "status",
							title: t("Status"),
							render: (data) => <Text>{data.status === 1 ? t("Active") : t("Inactive")}</Text>,
						},
						{
							accessor: "action",
							title: t("Action"),
							textAlign: "right",
							render: (data) => (
								<Group onClick={(e) => e.stopPropagation()} gap={4} justify="right" wrap="nowrap">
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
												<IconDotsVertical height="16" width="16" stroke={1.5} />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>
											<Menu.Item onClick={() => handleShowData(data)} w="200">
												{t("Show")}
											</Menu.Item>
											<Menu.Item onClick={() => handleEditCategory(data)} w="200">
												{t("Edit")}
											</Menu.Item>
											<Menu.Item
												w="200"
												mt="2"
												bg="red.1"
												c="red.6"
												onClick={() => handleDeleteCategory(data.id)}
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
					fetching={isLoading || isDeleting || isFetching}
					totalRecords={categories?.total || 0}
					recordsPerPage={PER_PAGE}
					page={page}
					onPageChange={setPage}
					loaderSize="xs"
					loaderColor="grape"
					height={height}
					scrollAreaProps={{ type: "never" }}
				/>
			</Box>

			<CategoryViewDrawer
				isLoading={isCategoryLoading || isCategoryFetching}
				opened={viewDrawer}
				onClose={closeViewDrawer}
				data={category?.data}
			/>

			<CategoryCreateDrawer opened={createDrawer} onClose={closeCreateDrawer} />

			<CategoryUpdateDrawer
				isLoading={isCategoryLoading || isCategoryFetching}
				opened={updateDrawer}
				onClose={closeUpdateDrawer}
				entityEditData={category?.data}
			/>
		</>
	);
}
