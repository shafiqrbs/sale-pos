const { contextBridge, ipcRenderer, webFrame } = require("electron");

console.info("Preload script starting...");

try {
	contextBridge.exposeInMainWorld("dbAPI", {
		// production startup start
		upsertIntoTable: (table, data) => {
			return ipcRenderer.invoke("upsert-into-table", table, data);
		},
		getDataFromTable: (table, id, property, options) => {
			return ipcRenderer.invoke("get-data-from-table", table, id, property, options);
		},
		getJoinedTableData: (data) => {
			return ipcRenderer.invoke("get-joined-table-data", data);
		},
		updateDataInTable: (table, values) => {
			return ipcRenderer.invoke("update-in-table", table, values);
		},
		deleteDataFromTable: (table, id, property) => {
			return ipcRenderer.invoke("delete-data-from-table", table, id, property);
		},
		deleteManyFromTable: (table, ids, property) => {
			return ipcRenderer.invoke("delete-many-from-table", table, ids, property);
		},
		getTableCount: (table, conditions, options) => {
			return ipcRenderer.invoke("get-table-count", table, conditions, options);
		},
		destroyTableData: (table) => {
			console.log("Calling destroyTableData...");
			return ipcRenderer.invoke("destroy-table-data", table);
		},
		resetDatabase: () => {
			console.log("Calling resetDatabase...");
			return ipcRenderer.invoke("reset-database");
		},
		relaunchApp: () => {
			return ipcRenderer.invoke("relaunch-app");
		},
	});
	console.info("dbAPI exposed successfully");

	contextBridge.exposeInMainWorld("deviceAPI", {
		thermalPrint: (data) => {
			return ipcRenderer.invoke("pos-thermal", data);
		},
		kitchenPrint: (data) => {
			return ipcRenderer.invoke("kitchen-thermal", data);
		},
	});
	console.info("deviceAPI exposed successfully");

	contextBridge.exposeInMainWorld("zoomAPI", {
		setZoomFactor: (factor) => {
			webFrame.setZoomFactor(factor);
		},
		getZoomFactor: () => {
			return webFrame.getZoomFactor();
		},
		onZoomChange: (callback) => {
			ipcRenderer.on("zoom-changed", (event, zoomFactor) => {
				callback(zoomFactor);
			});
		},
	});
	console.info("zoomAPI exposed successfully");
} catch (error) {
	console.error("Error in preload script:", error);
}
