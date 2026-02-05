import React, { useState } from "react";
import { ActionIcon, Box, Button, Flex, Grid, Popover, Text, Tooltip, ScrollArea } from "@mantine/core";
import {
	IconDeviceMobile,
	IconFileInvoice,
	IconFilter,
	IconRefreshDot,
	IconSearch,
	IconUserCircle,
	IconX,
} from "@tabler/icons-react";
import InputForm from "@components/form-builders/InputForm";
import { useTranslation } from "react-i18next";
import { useForm } from "@mantine/form";
import SelectForm from "@components/form-builders/SelectForm";
import InputNumberForm from "@components/form-builders/InputNumberForm";
import { ADVANCED_FILTER_SEARCH_OPERATOR } from "@constants/index";

const DROPDOWN_DATA = Object.entries(ADVANCED_FILTER_SEARCH_OPERATOR.INPUT_PARAMETER).map(([ _, value ], index) => ({
	id: index,
	label: value,
	value: value,
}));

export default function AdvancedFilter({ mainAreaHeight, bd = "1px solid var(--theme-grey-color-1)" }) {
	const [ key, setKey ] = useState(0);
	const height = mainAreaHeight;

	const { t } = useTranslation();

	/*START CUSTOMER ADDED FORM INITIAL*/
	const [ advanceSearchFormOpened, setAdvanceSearchFormOpened ] = useState(false);
	const [ nameDropdown, setNameDropdown ] = useState(DROPDOWN_DATA[ 0 ].value);
	const [ mobileDropdown, setMobileDropdown ] = useState(DROPDOWN_DATA[ 0 ].value);
	const [ companyNameDropdown, setCompanyNameDropdown ] = useState(DROPDOWN_DATA[ 0 ].value);

	const advanceSearchForm = useForm({
		initialValues: {
			name: "",
			mobile: "",
			company_name: "",
			name_dropdown: "",
			mobile_dropdown: "",
			company_name_dropdown: "",
		},
		validate: {
			name: (value, values) => {
				// First check if any main field is filled
				if (!value && !values.mobile && !values.company_name) {
					return "At least one main field is required";
				}
				return null;
			},
			name_dropdown: (value, values) => {
				// Validate dropdown when name has value
				if (values.name && !value) {
					return true;
				}
				return null;
			},
			mobile: (value, values) => {
				if (!value && !values.name && !values.company_name) {
					return true;
				}
				return null;
			},
			mobile_dropdown: (value, values) => {
				if (values.mobile && !value) {
					return true;
				}
				return null;
			},
			company_name: (value, values) => {
				if (!value && !values.name && !values.mobile) {
					return "At least one main field is required";
				}
				return null;
			},
			company_name_dropdown: (value, values) => {
				if (values.company_name && !value) {
					return "Please select an option for Company Name";
				}
				return null;
			},
		},
	});

	const handleReset = () => {
		setNameDropdown("");
		setMobileDropdown("");
		setCompanyNameDropdown("");
		advanceSearchForm.reset();
		setKey(key + 1);
	};

	const handleSubmit = (values) => {
		console.log(values);
	};

	return (
		<Box>
			<Popover width="500" trapFocus position="bottom" withArrow shadow="xl" opened={advanceSearchFormOpened}>
				<Popover.Target>
					<Tooltip
						multiline
						bg="var(--theme-error-color)"
						offset={{ crossAxis: "-52", mainAxis: "5" }}
						position="top"
						ta="center"
						withArrow
						transitionProps={{ duration: 200 }}
						label={t("AdvanceSearch")}
					>
						<ActionIcon
							c="var(--theme-success-color)"
							bg="var(--mantine-color-white)"
							onClick={() =>
								advanceSearchFormOpened
									? setAdvanceSearchFormOpened(false)
									: setAdvanceSearchFormOpened(true)
							}
							bd={bd}
						>
							<IconFilter size={16} stroke={1.5} />
						</ActionIcon>
					</Tooltip>
				</Popover.Target>
				<Popover.Dropdown>
					<form onSubmit={advanceSearchForm.onSubmit(handleSubmit)}>
						<Box mt="es">
							<Box className="boxBackground borderRadiusAll" pt="les" mb="es" pb="les">
								<Text ta="center" fw={600} fz="sm">
									{t("AdvanceSearch")}
								</Text>
							</Box>
							<Box className="borderRadiusAll" bg="var(--mantine-color-white)">
								<ScrollArea h={height / 3} scrollbarSize={2} scrollbars="y" type="never">
									<Box p="xs">
										<Grid columns={15} gutter={{ base: "3xs" }}>
											<Grid.Col span={3}>
												<Text ta="left" fw={600} fz="sm" mt="3xs">
													{t("Name")}
												</Text>
											</Grid.Col>

											<Grid.Col span={5}>
												<SelectForm
													key={key}
													tooltip={t("SelectSearchLikeValue")}
													form={advanceSearchForm}
													name="name_dropdown"
													id="name_dropdown"
													label=""
													nextField="name"
													placeholder="Search Like"
													dropdownValue={DROPDOWN_DATA}
													value={nameDropdown}
													changeValue={setNameDropdown}
												/>
											</Grid.Col>
											<Grid.Col span={7}>
												<InputForm
													tooltip={t("NameValidateMessage")}
													label=""
													placeholder={t("Name")}
													nextField={"mobile_dropdown"}
													form={advanceSearchForm}
													name={"name"}
													id={"name"}
													leftSection={<IconUserCircle size={16} opacity={0.5} />}
													rightIcon={""}
												/>
											</Grid.Col>
										</Grid>
									</Box>
									<Box p="xs">
										<Grid columns={15} gutter={{ base: "3xs" }}>
											<Grid.Col span={3}>
												<Text ta="left" fw={600} fz="sm" mt="3xs">
													{t("Mobile")}
												</Text>
											</Grid.Col>

											<Grid.Col span={5}>
												<SelectForm
													key={key}
													tooltip={t("SelectSearchLikeValue")}
													form={advanceSearchForm}
													name="mobile_dropdown"
													id="mobile_dropdown"
													nextField="mobile"
													label=""
													placeholder="Search Like"
													dropdownValue={DROPDOWN_DATA}
													value={mobileDropdown}
													changeValue={setMobileDropdown}
												/>
											</Grid.Col>
											<Grid.Col span={7}>
												<InputNumberForm
													tooltip={t("MobileValidateMessage")}
													label=""
													placeholder={t("Mobile")}
													nextField={"company_name_dropdown"}
													form={advanceSearchForm}
													name={"mobile"}
													id={"mobile"}
													leftSection={<IconDeviceMobile size={16} opacity={0.5} />}
													rightIcon={""}
												/>
											</Grid.Col>
										</Grid>
									</Box>
									<Box p="xs">
										<Grid columns={15} gutter={{ base: "3xs" }}>
											<Grid.Col span={3}>
												<Text ta="left" fw={600} fz="sm" mt="3xs">
													{t("Company")}
												</Text>
											</Grid.Col>

											<Grid.Col span={5}>
												<SelectForm
													key={key}
													tooltip={t("SelectSearchLikeValue")}
													form={advanceSearchForm}
													name="company_name_dropdown"
													id="company_name_dropdown"
													nextField="company_name"
													label=""
													placeholder="Search Like"
													dropdownValue={DROPDOWN_DATA}
													value={companyNameDropdown}
													changeValue={setCompanyNameDropdown}
												/>
											</Grid.Col>
											<Grid.Col span={7}>
												<InputForm
													tooltip={t("CompanyNameValidateMessage")}
													label=""
													placeholder={t("CompanyName")}
													nextField={"EntityFormSubmit"}
													form={advanceSearchForm}
													name={"company_name"}
													id={"company_name"}
													leftSection={<IconFileInvoice size={16} opacity={0.5} />}
													rightIcon={""}
												/>
											</Grid.Col>
										</Grid>
									</Box>
								</ScrollArea>
							</Box>
						</Box>
						<Box className="borderRadiusAll boxBackground" p="les">
							<Flex gap="es" align="center" justify="space-between">
								<Button
									variant="outline"
									c="var(--theme-primary-color-6)"
									size="xs"
									onClick={() => setAdvanceSearchFormOpened(false)}
									style={{ border: "1px solid var(--theme-primary-color-6)" }}
									leftSection={<IconX size={16} stroke={1.5} />}
								>
									<Text fz="sm" fw={400}>
										{t("Close")}
									</Text>
								</Button>
								<Flex gap="es" align="center">
									<Button
										variant="transparent"
										size="sm"
										color="var(--theme-error-color)"
										onClick={handleReset}
									>
										<IconRefreshDot size={16} stroke={1.5} />
									</Button>

									<Button
										size="xs"
										color="var(--theme-primary-color-6)"
										type="submit"
										id={"EntityFormSubmit"}
										leftSection={<IconSearch size={16} />}
									>
										<Text fz="sm" fw={400}>
											{t("Search")}
										</Text>
									</Button>
								</Flex>
							</Flex>
						</Box>
					</form>
				</Popover.Dropdown>
			</Popover>
		</Box>
	);
}
