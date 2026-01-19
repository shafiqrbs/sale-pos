import axios from "axios";

const vendorDataStoreIntoLocalStorage = async () => {
	try {
		const user = await window.dbAPI.getDataFromTable("users");
		const userId = user ? user.id : {};

		const response = await axios.get(
			`${import.meta.env.VITE_API_GATEWAY_URL}core/vendor/local-storage`,
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
					"X-Api-Key": import.meta.env.VITE_API_KEY,
					"X-Api-User": userId,
				},
			}
		);

		let { data } = response;

		if (data && data.data) {
			await Promise.all(
				data.data.map(async (vendor) => {
					await window.dbAPI.upsertIntoTable("core-vendors", vendor);
				})
			);
		}
	} catch (error) {
		console.error(error);
	}
};

export default vendorDataStoreIntoLocalStorage;
