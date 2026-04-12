import { isNotEmpty } from "@mantine/form";

const initialValues = {
	particular_type_id: "",
	name: "",
	status: true,
};

export const particularRequest = (t) => ({
	initialValues,
	validate: {
		particular_type_id: isNotEmpty(t("ChooseSettingType")),
		name: isNotEmpty(t("SettingNameRequired")),
	},
});
