import { app, BrowserWindow, screen } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === "development";

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
}
