import { app, BrowserWindow, screen } from "electron";
import path from "node:path";

const __dirname = path.resolve();

const isDev = !app.isPackaged;

app.setAppUserModelId("com.solutionroad.weightmanagement");

let mainWindow: BrowserWindow | null = null;
const iconPath = path.join(app.getAppPath(), 'assets', 'logo.png');
console.log('Icon path:', iconPath);

function createMainWindow() {
	const primaryDisplay = screen.getPrimaryDisplay();

	const { width, height } = primaryDisplay.workAreaSize;

	// Recommended initial sizing
	const windowWidth = Math.floor(width * 0.9);
	const windowHeight = Math.floor(height * 0.9);

	mainWindow = new BrowserWindow({
		icon: iconPath,

		width: windowWidth,
		height: windowHeight,
		autoHideMenuBar: isDev,

		title: "Solution Road Weight Management",
        
		backgroundColor: "#f2f2f2",
		show: false,
		webPreferences: {
			preload: path.join(__dirname, "dist", "preload", "preload.js"),

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
