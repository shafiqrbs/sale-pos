import axios from "axios";

const tableMap = {
	// "inventory/config": "config_data",
	// "inventory/stock-item": "core_products",
	// "core/customer/local-storage": "core_customers",
	// "core/vendor/local-storage": "core_vendors",
	// "core/user/local-storage": "core_users",
	"inventory/pos/check/invoice-mode": "invoice_table",
	"accounting/transaction-mode/local-storage": "accounting_transaction_mode",
	"inventory/sales": "sales",
	"inventory/purchase": "purchase",
};

const commonDataStoreIntoLocalStorage = async (user_id) => {
	const requests = Object.entries(tableMap).map(async ([route, table]) => {
		try {
			const response = await axios({
				method: "get",
				url: `${import.meta.env.VITE_API_GATEWAY_URL + route}`,
				headers: {
					Accept: `application/json`,
					"Content-Type": `application/json`,
					"Access-Control-Allow-Origin": "*",
					"X-Api-Key": import.meta.env.VITE_API_KEY,
					"X-Api-User": user_id,
				},
			});

			if (response.data.data) {
				const dataList = Array.isArray(response.data.data)
					? response.data.data
					: [response.data.data];

				for (const data of dataList) {
					// insert only if data is new or different
					if (table === "config_data") {
						const newData = {
							id: data.id,
							data: JSON.stringify(data),
						};
						window.dbAPI.upsertIntoTable(table, newData);
					} else {
						window.dbAPI.upsertIntoTable(table, data);
					}
				}
			}
		} catch (error) {
			console.error(`Failed to fetch ${route}:`, error);
		}
	});

	await Promise.all(requests);
};

export default commonDataStoreIntoLocalStorage;
