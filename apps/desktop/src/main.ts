import { app, BrowserWindow, screen } from "electron";
import path from "node:path";

const __dirname = path.resolve();

const isDev = !app.isPackaged;

app.setAppUserModelId("com.solutionroad.weightmanagement");

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
	const primaryDisplay = screen.getPrimaryDisplay();

	const { width, height } = primaryDisplay.workAreaSize;

	// Recommended initial sizing
	const windowWidth = Math.floor(width * 0.9);
	const windowHeight = Math.floor(height * 0.9);

	mainWindow = new BrowserWindow({
		width: windowWidth,
		height: windowHeight,
		autoHideMenuBar: true,

		backgroundColor: "#1e1e1e",
		show: false,

		webPreferences: {
			preload: path.join(__dirname, "preload", "preload.js"),

			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
		},
	});

	// Show only when ready
	mainWindow.once("ready-to-show", () => {
		mainWindow?.show();

		if (isDev) {
			mainWindow?.webContents.openDevTools();
		}
	});

	if (isDev) {
		// Load frontend
		mainWindow.loadURL("http://localhost:2500");
	} else {
		mainWindow.loadFile(path.join(__dirname, "../../renderer/dist/index.html"));
	}

	// Cleanup
	mainWindow.on("closed", () => {
		mainWindow = null;
	});
}

app.whenReady().then(() => {
	createMainWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createMainWindow();
		}
	});
});

app.on("window-all-closed", () => {
	// macOS behavior
	if (process.platform !== "darwin") {
		app.quit();
	}
});
