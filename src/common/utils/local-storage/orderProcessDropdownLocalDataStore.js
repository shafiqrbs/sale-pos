import axios from "axios";

const orderProcessDropdownLocalDataStore = async (user_id) => {
	if (!user_id) return console.warn("No user id passed");

	try {
		const response = await axios({
			method: "get",
			url: `${import.meta.env.VITE_API_GATEWAY_URL}utility/select/setting`,
			headers: {
				Accept: `application/json`,
				"Content-Type": `application/json`,
				"Access-Control-Allow-Origin": "*",
				"X-Api-Key": import.meta.env.VITE_API_KEY,
				"X-Api-User": user_id,
			},
			params: { "dropdown-type": "sales-process-type" },
		});
		if (response?.data?.data?.length > 0) {
			const transformedData = response.data.data.map(({ id, name }, index) => ({
				id: index,
				label: name,
				value: id,
			}));

			for (const entry of transformedData) {
				await window.dbAPI.upsertIntoTable("order_process", entry);
			}
		}
	} catch (error) {
		console.error(error);
	}
};

export default orderProcessDropdownLocalDataStore;
