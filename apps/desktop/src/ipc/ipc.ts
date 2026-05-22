// apps/desktop/src/ipc/ipc.ts

import { getAllSettings, updateSettings } from '@weight/database/repositories/settings';
import { ipcMain } from 'electron';
import { getDatabase } from '../database/connection.js';
import { logger } from '../logger.js';
import type { SerialManager } from '../serial/serial-manager.js';

export function registerIpcHandlers(serialManager: SerialManager) {
  // ---------- Settings ----------
  ipcMain.handle('settings:get-all', () => {
    const db = getDatabase();
    const row = getAllSettings(db);
    if (!row) return null;
    // Return a plain object (camelCase keys)
    return {
      companyName: row.companyName,
      companyAddress: row.companyAddress,
      companyPhone: row.companyPhone,
      companyLogoPath: row.companyLogoPath,
      ticketPrefix: row.ticketPrefix,
      ticketFooter: row.ticketFooter,
      nextTicketNumber: row.nextTicketNumber,
      serialPort: row.serialPort,
      baudRate: row.baudRate,
      dataBits: row.dataBits,
      parity: row.parity,
      stopBits: row.stopBits,
      indicatorType: row.indicatorType,
      weightUnit: row.weightUnit,
      stableTolerance: row.stableTolerance,
      stableDurationMs: row.stableDurationMs,
      theme: row.theme,
      autoPrint: row.autoPrint,
      printerName: row.printerName,
      printCopies: row.printCopies,
      setupCompleted: row.setupCompleted,
    };
  });

  ipcMain.handle('settings:update', (_event, data: Record<string, any>) => {
    const db = getDatabase();
    updateSettings(db, data);
    db.save();
    return true;
  });

  // ---------- Setup wizard ----------
  ipcMain.handle('app:is-setup-completed', () => {
    const db = getDatabase();
    const row = getAllSettings(db);
    return row?.setupCompleted === true;
  });

  ipcMain.handle('app:complete-setup', async (_event, newSettings: Record<string, any>) => {
    const db = getDatabase();
    updateSettings(db, { ...newSettings, setupCompleted: true });
    db.save();
    return true;
  });

  // ---------- Serial status ----------
  ipcMain.handle('serial:get-status', () => {
    return serialManager.getStatus();
  });

  // ---------- Renderer logging ----------
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
}
