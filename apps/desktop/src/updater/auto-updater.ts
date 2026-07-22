import type { BrowserWindow } from 'electron';
import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { logger } from '../logger.js';
import { UPDATE_GITHUB } from './update-config.js';
import { UPDATE_GH_TOKEN } from './update-token.generated.js';

export type UpdateStatusEvent =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available'; version: string }
  | { type: 'progress'; percent: number; transferred: number; total: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string };

type PrepareInstall = () => void | Promise<void>;

let getMainWindow: (() => BrowserWindow | null) | null = null;
let prepareInstall: PrepareInstall | null = null;
let started = false;

function send(event: UpdateStatusEvent) {
  const win = getMainWindow?.();
  if (win && !win.isDestroyed()) {
    win.webContents.send('update:status', event);
  }
}

/**
 * Private GitHub Releases require a read-only token baked at package time (UPDATE_GH_TOKEN).
 * Tokens inside the binary can be extracted — use a fine-grained Contents:Read PAT and rotate it.
 */
export function startAutoUpdater(options: {
  getMainWindow: () => BrowserWindow | null;
  prepareInstall?: PrepareInstall;
}) {
  if (started || !app.isPackaged) {
    return;
  }
  started = true;
  getMainWindow = options.getMainWindow;
  prepareInstall = options.prepareInstall ?? null;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: UPDATE_GITHUB.owner,
    repo: UPDATE_GITHUB.repo,
    private: UPDATE_GITHUB.private,
    token: UPDATE_GH_TOKEN || undefined,
  });

  autoUpdater.on('checking-for-update', () => {
    send({ type: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    send({ type: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', (info) => {
    send({ type: 'not-available', version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    send({
      type: 'progress',
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    send({ type: 'downloaded', version: info.version });
  });

  autoUpdater.on('error', (error) => {
    logger.error(`[updater] ${error.message}`);
    send({ type: 'error', message: error.message });
  });

  // Silent check shortly after startup so About tab can show status without a click
  setTimeout(() => {
    void checkForAppUpdates().catch((error) => {
      logger.warn(`[updater] startup check failed: ${(error as Error).message}`);
    });
  }, 8_000);
}

export function getAppVersion(): string {
  return app.getVersion();
}

export async function checkForAppUpdates() {
  if (!app.isPackaged) {
    send({ type: 'not-available', version: app.getVersion() });
    return { updateInfo: null as null };
  }
  return autoUpdater.checkForUpdates();
}

export async function downloadAppUpdate() {
  if (!app.isPackaged) {
    throw new Error('Updates are only available in packaged builds');
  }
  return autoUpdater.downloadUpdate();
}

export async function installAppUpdate() {
  if (!app.isPackaged) {
    throw new Error('Updates are only available in packaged builds');
  }
  if (prepareInstall) {
    await prepareInstall();
  }
  // isSilent=false, isForceRunAfter=true
  autoUpdater.quitAndInstall(false, true);
}
