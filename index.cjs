const { app, BrowserWindow, session } = require("electron");
const path = require("path");
const { close: closeDb } = require("./electron/connection.cjs");
const { initSchema } = require("./electron/schema.cjs");
const { registerIpcHandlers } = require("./electron/ipcHandlers.cjs");

let mainWindow;
let splash;

// =============== resolve the correct icon based on the OS since windows needs .ico and linux/mac needs .png ================
const appIcon = path.join(
	__dirname,
	"icons",
	process.platform === "win32" ? "brand.ico" : "brand.png"
);

// run this as early in the main process as possible
if (require("electron-squirrel-startup")) app.quit();

app.whenReady().then(() => {
	initSchema();
	registerIpcHandlers();

	const isDev = !app.isPackaged;
	session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({
			responseHeaders: {
				...details.responseHeaders,
				"Content-Security-Policy": [
					isDev
						? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: http:; font-src 'self' data: https://fonts.gstatic.com;"
						: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https: http:; font-src 'self' data: https://fonts.gstatic.com;",
				],
			},
		});
	});

	// Create Splash Screen
	splash = new BrowserWindow({
		width: 810,
		height: 610,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		icon: appIcon,
	});

	// Load splash screen HTML
	splash.loadFile(path.join(__dirname, "dist", "splash.html"));

	// Create Main Window (but keep it hidden initially)
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		icon: appIcon,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.cjs"),
			devTools: !app.isPackaged,
			sandbox: true,
		},
		autoHideMenuBar: true,
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

app.on("before-quit", () => {
	try {
		closeDb();
	} catch (e) {
		console.error("Error closing database:", e);
	}
});

// Quit app when all windows are closed (except macOS)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
