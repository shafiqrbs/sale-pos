const { ipcMain, BrowserWindow, app } = require("electron");
const dbModule = require("./db.cjs");
const deviceModule = require("./pos.cjs");
const authModule = require("./auth.cjs");

const registerDbHandlers = () => {
	ipcMain.handle("upsert-into-table", async (event, table, data) => {
		try {
			return dbModule.upsertIntoTable(table, data);
		} catch (error) {
			console.error(`Error upserting ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("update-in-table", async (event, table, values) => {
		try {
			return dbModule.updateDataInTable(table, values);
		} catch (error) {
			console.error(`Error updating ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("get-data-from-table", async (event, table, id, property, options) => {
		try {
			return dbModule.getDataFromTable(table, id, property, options);
		} catch (error) {
			console.error(`Error getting data from ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("delete-data-from-table", async (event, table, id, property) => {
		try {
			return dbModule.deleteDataFromTable(table, id, property);
		} catch (error) {
			console.error(`Error deleting data from ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("delete-many-from-table", async (event, table, ids, property) => {
		try {
			return dbModule.deleteManyFromTable(table, ids, property);
		} catch (error) {
			console.error(`Error deleting many data from ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("destroy-table-data", async (event, table) => {
		try {
			return dbModule.destroyTableData(table);
		} catch (error) {
			console.error(`Error destroying data:`, error);
			throw error;
		}
	});

	ipcMain.handle("clear-and-insert-bulk", async (event, table, dataArray, options = {}) => {
		try {
			return dbModule.clearAndInsertBulk(table, dataArray, {
				batchSize: options.batchSize ?? 500,
				onProgress: (progress) => {
					if (!event.sender.isDestroyed()) {
						event.sender.send("db-progress", progress);
					}
				},
			});
		} catch (error) {
			console.error(`Error clearing and inserting bulk data for ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("reset-database", async () => {
		try {
			return dbModule.resetDatabase();
		} catch (error) {
			console.error(`Error resetting data`);
			throw error;
		}
	});

	ipcMain.handle("get-table-count", async (event, table, conditions, options) => {
		try {
			return dbModule.getTableCount(table, conditions, options);
		} catch (error) {
			console.error(`Error getting table count for ${table}:`, error);
			throw error;
		}
	});

	ipcMain.handle("get-joined-table-data", async (event, data) => {
		try {
			return dbModule.getJoinedTableData(data);
		} catch (error) {
			console.error("Error occurred on getting joined table data: ", error);
			throw error;
		}
	});
};

const registerPosHandlers = () => {
	ipcMain.handle("pos-print", async (event, data) => {
		try {
			return deviceModule.print(data);
		} catch (error) {
			console.error("Error occurred on pos printing:", error);
			throw error;
		}
	});

	ipcMain.handle("pos-thermal", async (event, data) => {
		try {
			return deviceModule.thermalPrint(data);
		} catch (error) {
			console.error("Error occurred on pos thermal printing: ", error);
			throw error;
		}
	});

	ipcMain.handle("kitchen-thermal", async (event, data) => {
		try {
			return deviceModule.kitchenPrint(data);
		} catch (error) {
			console.error("Error occurred on kitchen thermal printing: ", error);
			throw error;
		}
	});
};

const registerAuthHandlers = () => {
	ipcMain.handle("login-user", async (event, credentials) => {
		try {
			return authModule.loginUser(credentials);
		} catch (error) {
			console.error("Error occurred on user login: ", error);
			throw error;
		}
	});
};

const registerAppHandlers = () => {
	ipcMain.handle("relaunch-app", async () => {
		try {
			await dbModule.close();
			app.relaunch();
			app.exit(0);
		} catch (error) {
			console.error("Error occurred on relaunching app: ", error);
		}
	});

	ipcMain.handle("reload-app", async (event) => {
		try {
			const win = BrowserWindow.fromWebContents(event.sender);
			if (win) win.reload();
		} catch (error) {
			console.error("Error occurred on reloading app: ", error);
			throw error;
		}
	});
};

const registerIpcHandlers = () => {
	registerDbHandlers();
	registerPosHandlers();
	registerAppHandlers();
	registerAuthHandlers();
};

module.exports = { registerIpcHandlers };
