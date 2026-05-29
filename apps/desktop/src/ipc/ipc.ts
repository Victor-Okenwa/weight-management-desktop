// apps/desktop/src/ipc/ipc.ts

import { getAllSettings, updateSettings } from '@weight/database/repositories/settings';
import type { SerialOptions } from '@weight/shared/types/index';
import { ipcMain } from 'electron';
import { SerialPort } from 'serialport';
import { getDatabase } from '../database/connection.js';
import { logger } from '../logger.js';
import type { SerialManager } from '../serial/serial-manager.js';

export function registerIpcHandlers(serialManager: SerialManager) {
  // Serial-port
  ipcMain.handle('serial:list-ports', async () => {
    const ports = await SerialPort.list();
    // Return only the fields the renderer needs
    return ports.map((p) => ({
      path: p.path,
      manufacturer: p.manufacturer || 'Unknown',
      serialNumber: p.serialNumber,
      pnpId: p.pnpId,
      productId: p.productId,
    }));
  });

  // Serial Reconnection
  ipcMain.handle('serial:reconnect', () => {
    const db = getDatabase();
    const row = getAllSettings(db);

    if (row) {
      const newOptions: SerialOptions = {
        port: (row.serialPort || 'COM1') as `COM${number}`,
        baudRate: (row.baudRate || 2400) as 2400,
        dataBits: (row.dataBits || 8) as 8,
        stopBits: (row.stopBits || 1) as 1,
        parity: (row.parity || 'none') as 'none',
        flowControl: (row.flowControl || 'none') as 'none',
        autoOpen: row.autoOpen || false,
      };
      // Instruct the serial manager to reconnect with the new settings
      serialManager.reconnect(newOptions);
    }
  });

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
      flowControl: row.flowControl,
      autoOpen: row.autoOpen,
    };
  });

  ipcMain.handle('settings:update', (_event, data: Record<string, never>) => {
    const db = getDatabase();
    updateSettings(db, data);
    db.save();

    // Check if any serial‑related settings were changed
    const serialKeys = [
      'serialPort',
      'baudRate',
      'dataBits',
      'parity',
      'stopBits',
      'indicatorType',
      'flowControl',
    ];

    const hasSerialChange = Object.keys(data).some((key) => serialKeys.includes(key));

    if (hasSerialChange) {
      // Read the full settings row to get all serial options
      const row = getAllSettings(db);
      if (row) {
        const newOptions: SerialOptions = {
          port: (row.serialPort || 'COM1') as `COM${number}`,
          baudRate: (row.baudRate || 2400) as 2400,
          dataBits: (row.dataBits || 8) as 8,
          stopBits: (row.stopBits || 1) as 1,
          parity: (row.parity || 'none') as 'none',
          flowControl: (row.flowControl || 'none') as 'none',
          autoOpen: row.autoOpen || false,
        };
        // Instruct the serial manager to reconnect with the new settings
        serialManager.reconnect(newOptions);
      }
    }

    return true;
  });

  // ---------- Setup wizard ----------
  ipcMain.handle('app:is-setup-completed', () => {
    const db = getDatabase();
    const row = getAllSettings(db);
    console.log('is app setup?', row?.setupCompleted);
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
