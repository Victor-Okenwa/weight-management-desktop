// apps/desktop/src/ipc/ipc.ts

import { deleteMaterial, getAllMaterials, getMaterialsPaginated, updateMaterial } from '@weight/database/repositories/materials';
import {
  checkDatabaseHealth,
} from '@weight/database/repositories/health';
import {
  createRecord,
  deleteRecord,
  deleteRecords,
  getRecordById,
  getRecordsPaginated,
  updateRecord,
} from '@weight/database/repositories/record';
import { getAllSettings, updateSettings } from '@weight/database/repositories/settings';
import { deleteVehicle, getAllVehicles, getVehiclesPaginated, updateVehicle } from '@weight/database/repositories/vehicles';
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
      companyEmail: row.companyEmail,
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

  ipcMain.handle('app:complete-setup', async (_event, newSettings: Record<string, never>) => {
    const db = getDatabase();
    updateSettings(db, { ...newSettings, setupCompleted: true });
    db.save();
    return true;
  });

  // ---------- Serial status ----------
  ipcMain.handle('serial:get-status', () => {
    return serialManager.getStatus();
  });

  // ---------- Materials ----------
  ipcMain.handle('materials:get-all', () => {
    const db = getDatabase();
    return getAllMaterials(db);
  });

  ipcMain.handle('materials:get-paginated', (_event, page: number, pageSize: number, filters?) => {
    const db = getDatabase();
    return getMaterialsPaginated(db, page, pageSize, filters);
  });

  ipcMain.handle('materials:update', (_event, id: number, data) => {
    const db = getDatabase();
    const result = updateMaterial(db, id, data);
    db.save();
    return result;
  });

  ipcMain.handle('materials:delete', (_event, id: number) => {
    const db = getDatabase();
    deleteMaterial(db, id);
    db.save();
  });

  // ---------- Vehicles ----------
  ipcMain.handle('vehicles:get-all', () => {
    const db = getDatabase();
    return getAllVehicles(db);
  });

  ipcMain.handle('vehicles:get-paginated', (_event, page: number, pageSize: number, filters?) => {
    const db = getDatabase();
    return getVehiclesPaginated(db, page, pageSize, filters);
  });

  ipcMain.handle('vehicles:update', (_event, id: number, data) => {
    const db = getDatabase();
    const result = updateVehicle(db, id, data);
    db.save();
    return result;
  });

  ipcMain.handle('vehicles:delete', (_event, id: number) => {
    const db = getDatabase();
    deleteVehicle(db, id);
    db.save();
  });

  // ---------- Records ----------
  ipcMain.handle('records:create', (_event, data) => {
    const db = getDatabase();
    const record = createRecord(db, data);
    db.save();
    return record;
  });

  ipcMain.handle('records:update', (_event, id: number, data) => {
    const db = getDatabase();
    const record = updateRecord(db, id, data);
    db.save();
    return record;
  });

  ipcMain.handle('records:get-by-id', (_event, id: number) => {
    const db = getDatabase();
    return getRecordById(db, id);
  });

  ipcMain.handle('records:get-paginated', (_event, page: number, pageSize: number, filters?) => {
    const db = getDatabase();
    return getRecordsPaginated(db, page, pageSize, filters);
  });

  ipcMain.handle('records:delete', (_event, id: number) => {
    const db = getDatabase();
    const result = deleteRecord(db, id);
    db.save();
    return result;
  });

  ipcMain.handle('records:delete-many', (_event, ids: number[]) => {
    const db = getDatabase();
    const count = deleteRecords(db, ids);
    db.save();
    return count;
  });

  // ---------- Renderer logging ----------
  ipcMain.handle('db:health-check', () => {
    const db = getDatabase();
    return checkDatabaseHealth(db);
  });

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
