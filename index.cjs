const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const dbModule = require("./electron/db.cjs");
const deviceModule = require("./electron/pos.cjs");

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

ipcMain.handle("get-data-from-table", async (event, table, id, property) => {
	try {
		return dbModule.getDataFromTable(table, id, property);
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

ipcMain.handle("reset-database", async () => {
	try {
		return dbModule.resetDatabase();
	} catch (error) {
		console.error(`Error resetting data`);
		throw error;
	}
});

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
	}
});

ipcMain.handle("kitchen-thermal", async (event, data) => {
	try {
		return deviceModule.kitchenPrint(data);
	} catch (error) {
		console.error("Error occurred on kitchen thermal printing: ", error);
	}
});

ipcMain.handle("get-joined-table-data", async (event, data) => {
	try {
		return dbModule.getJoinedTableData(data);
	} catch (error) {
		console.error("Error occurred on getting joined table data: ", error);
	}
});

let mainWindow;
let splash;

// run this as early in the main process as possible
if (require("electron-squirrel-startup")) app.quit();

// enable serial port
app.commandLine.appendSwitch("enable-features", "Serial");

app.whenReady().then(() => {
	// Create Splash Screen
	splash = new BrowserWindow({
		width: 810,
		height: 610,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		icon: path.join(__dirname, "images", "list"),
	});

	// Load splash screen HTML
	splash.loadFile(path.join(__dirname, "dist", "splash.html"));

	// Create Main Window (but keep it hidden initially)
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		icon: path.join(__dirname, "images", "list"),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			enableBlinkFeatures: "Serial",
			experimentalFeatures: true,
			preload: path.join(__dirname, "preload.cjs"),
			// for debugging purpose only
			devTools: true,
			sandbox: false,
		},
		autoHideMenuBar: true,
	});
	mainWindow.webContents.session.on(
		"select-serial-port",
		(event, portList, webContents, callback) => {
			mainWindow.webContents.session.on("serial-port-added", (event, port) => {
				console.log("serial-port-added FIRED WITH", port);
			});

			mainWindow.webContents.session.on("serial-port-removed", (event, port) => {
				console.log("serial-port-removed FIRED WITH", port);
			});

			event.preventDefault();
			if (portList && portList.length > 0) {
				callback(portList[ 0 ].portId);
			} else {
				callback("");
			}
		}
	);

	mainWindow.webContents.session.setPermissionCheckHandler(
		(webContents, permission, requestingOrigin, details) => {
			if (permission === "serial") {
				return true;
			}

			return false;
		}
	);

	mainWindow.webContents.session.setDevicePermissionHandler((details) => {
		if (details.deviceType === "serial") {
			return true;
		}

		return false;
	});

	// Load Main App after splash screen
	const startURL =
		process.env.ELECTRON_START_URL || `file://${path.join(__dirname, "dist", "index.html")}`;
	if (startURL.startsWith("http")) {
		mainWindow.loadURL(startURL);
	} else {
		mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));
	}

	// Once the main window is ready, close the splash screen and show the main window
	mainWindow.once("ready-to-show", () => {
		splash.destroy();
		mainWindow.maximize();
		mainWindow.show();
	});

	mainWindow.webContents.on("zoom-changed", (event, zoomDirection) => {
		const currentZoom = mainWindow.webContents.getZoomFactor();
		mainWindow.webContents.send("zoom-changed", currentZoom);
	});
});

// Quit app when all windows are closed (except macOS)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
