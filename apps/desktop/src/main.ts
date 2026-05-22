import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // load local env overrides

import path from 'node:path';
import { getAllSettings } from '@weight/database/repositories/settings';
import type { SerialOptions, SettingsRow } from '@weight/shared/types/index';
import { app, BrowserWindow, screen } from 'electron';
import { getDatabase, setupDatabase } from './database/connection.js';
import { registerIpcHandlers } from './ipc/ipc.js';
import type { IndicatorType } from './parser/index.js';
import { SerialManager } from './serial/serial-manager.js';

const __dirname = path.resolve();

const isDev = !app.isPackaged;

const harcodedSerialOptions = {
  port: 'COM7',
  baudRate: 2400,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
  autoOpen: false,
};

app.setAppUserModelId('com.solutionroad.weightmanagement');

let mainWindow: BrowserWindow | null = null;
const iconPath = path.join(app.getAppPath(), 'assets', 'logo.png');

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

    title: 'Solution Road Weight Management',

    backgroundColor: '#1e1e1e',
    show: true,

    webPreferences: {
      preload: path.join(__dirname, 'dist', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      enableWebSQL: true,
    },
  });

  // Show only when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();

    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  mainWindow.webContents.openDevTools();

  if (isDev) {
    // Load frontend
    // mainWindow.loadURL(`data:text/html,<h1>Hello</h1>`);
    mainWindow.loadURL('http://localhost:2500');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
  }

  // Cleanup
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Helper to read serial options from settings with fallbacks
function getSerialOptions(settingsRow: SettingsRow): SerialOptions {
  return {
    port: (settingsRow.serialPort || 'COM1') as `COM${number}`,
    baudRate: (settingsRow.baudRate || 2400) as 2400,
    dataBits: (settingsRow.dataBits || 8) as 8,
    stopBits: (settingsRow.stopBits || 1) as 1,
    parity: (settingsRow.parity || 'none') as 'none',
    flowControl: 'none', // not stored in settings yet, keep default
    autoOpen: false,
  };
}

app.whenReady().then(async () => {
  // 1. Database ready
  await setupDatabase();
  const db = getDatabase();

  // 2. Read current settings (there is exactly one row after seeding)
  const settingsRow = getAllSettings(db);
  const serialOptions = getSerialOptions(settingsRow as SettingsRow);
  const indicatorType = settingsRow?.indicatorType || 'd300';

  // 3. Create serial manager
  const serialManager = new SerialManager(
    indicatorType as IndicatorType,
    (reading) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('weight:update', reading);
      }
    },
    (status) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('serial:status', status);
      }
    },
  );

  // 4. Register all IPC handlers (now they have access to serialManager)
  registerIpcHandlers(serialManager);

  // 5. Open the window
  createMainWindow();

  // 6. Connect to serial port
  serialManager.connect(serialOptions);

  // 7. App lifecycle events
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  app.on('before-quit', async (event) => {
    event.preventDefault();
    serialManager.disconnect();
    const currentDb = getDatabase();
    currentDb.save();
    currentDb.close();
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('window-all-closed', () => {
  // macOS behavior
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
