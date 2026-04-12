import { isNotEmpty } from "@mantine/form";

const initialValues = {
	parent: "",
	name: "",
	expiry_duration: "",
	status: true,
};

export const categoryRequest = (t) => ({
	initialValues,
	validate: {
		parent: isNotEmpty(t("ChooseCategoryGroup")),
		name: isNotEmpty(t("CategoryNameValidateMessage")),
	},
});
