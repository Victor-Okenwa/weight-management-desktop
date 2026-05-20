import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // load local env overrides

import path from 'node:path';
import { initDatabase } from '@weight/database';
import { getAllSettings, getSetting, setSetting } from '@weight/database/repositories/settings';
import type { SerialOptions } from '@weight/shared/types/index';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { getDatabase, setupDatabase } from './database/connection.js';
import { logger } from './logger.js';
import { SerialManager } from './serial/serial-manager.js';

const __dirname = path.resolve();

const isDev = !app.isPackaged;

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

app.whenReady().then(async () => {
  await setupDatabase();

  ipcMain.handle('app:is-setup-completed', () => {
    const db = getDatabase();
    return getSetting(db, 'setup_completed') === 'true';
  });

  ipcMain.handle('app:complete-setup', async (_event, newSettings: Record<string, string>) => {
    const db = getDatabase();
    // Save all provided settings
    for (const [key, value] of Object.entries(newSettings)) {
      setSetting(db, key, value);
    }
    // Mark setup as completed
    setSetting(db, 'setup_completed', 'true');
    db.save(); // persist immediately
    return true;
  });

  ipcMain.handle('serial:get-status', () => {
    return serialManager.getStatus();
  });

  ipcMain.handle('settings:get', (_event, key: string) => {
    const db = getDatabase();
    return getSetting(db, key);
  });

  // Get all settings (useful for initialising the settings screen)
  ipcMain.handle('settings:get-all', () => {
    const db = getDatabase();
    return getAllSettings(db); // import from repository
  });

  // Update a single setting
  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    const db = getDatabase();
    setSetting(db, key, value);
    db.save(); // persist immediately after change
    return true;
  });

  ipcMain.handle('settings:set-multiple', (_event, settingsObject: Record<string, string>) => {
    const db = getDatabase();
    for (const [key, value] of Object.entries(settingsObject)) {
      setSetting(db, key, value);
    }
    db.save(); // single save after all changes
    return true;
  });

  const indicatorType = 'd300';

  const serialOptions: SerialOptions = {
    port: 'COM7',
    baudRate: 2400,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    flowControl: 'none',
    autoOpen: false,
  };

  const serialManager = new SerialManager(
    indicatorType,
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

  serialManager.connect(serialOptions);

  // Handle log messages from renderer
  ipcMain.on('log', (_event, { level, message }: { level: string; message: string }) => {
    switch (level) {
      case 'error':
        logger.error(`[renderer] ${message}`);
        break;
      case 'warn':
        logger.warn(`[renderer] ${message}`);
        break;
      case 'info':
        logger.info(`[renderer] ${message}`);
        break;
      case 'debug':
        logger.debug(`[renderer] ${message}`);
        break;
      default:
        logger.info(`[renderer] ${message}`);
    }
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  app.on('before-quit', async (event) => {
    event.preventDefault();
    serialManager.disconnect();
    const db = getDatabase();
    db.save(); // ensure latest data is written
    db.close();
    app.quit();
  });
});

app.on('window-all-closed', () => {
  // macOS behavior
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
