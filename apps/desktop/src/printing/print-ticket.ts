import type { PaperSizeGroup, PrintTicketResult, SettingsRow } from '@weight/shared/types/index';
import { getRecordById } from '@weight/database/repositories/record';
import { getAllSettings } from '@weight/database/repositories/settings';
import { BrowserWindow } from 'electron';
import { getDatabase } from '../database/connection.js';
import { logger } from '../logger.js';
import { buildSlipHtml } from './slip-template.js';

export async function printTicket(input: {
  printerName: string;
  paperSize: PaperSizeGroup;
  copies: number;
  recordId: number;
}): Promise<PrintTicketResult> {
  const printerName = input.printerName?.trim();
  if (!printerName) {
    return { ok: false, error: 'Printer name is required' };
  }

  const copies = Number.isFinite(input.copies) ? Math.max(1, Math.floor(input.copies)) : 1;

  const db = getDatabase();
  const record = getRecordById(db, input.recordId);
  if (!record) {
    return { ok: false, error: `Record ${input.recordId} not found` };
  }

  const settingsRow = getAllSettings(db);
  if (!settingsRow) {
    return { ok: false, error: 'Settings not initialized' };
  }

  const settings: SettingsRow = {
    ...settingsRow,
    baudRate: settingsRow.baudRate as SettingsRow['baudRate'],
    dataBits: settingsRow.dataBits as SettingsRow['dataBits'],
    stopBits: settingsRow.stopBits as SettingsRow['stopBits'],
    parity: settingsRow.parity as SettingsRow['parity'],
    flowControl: settingsRow.flowControl as SettingsRow['flowControl'],
    printPaperSize: (settingsRow.printPaperSize || '80mm') as PaperSizeGroup,
  };

  const html = buildSlipHtml(record, settings, input.paperSize);

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    const printers = await printWindow.webContents.getPrintersAsync();
    const matched = printers.find(
      (p) => p.name === printerName || p.displayName === printerName,
    );
    if (!matched) {
      return { ok: false, error: `Printer "${printerName}" was not found` };
    }

    await new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: matched.name,
          copies,
        },
        (success, failureReason) => {
          if (success) resolve();
          else reject(new Error(failureReason || 'Print failed'));
        },
      );
    });

    return { ok: true };
  } catch (err) {
    const message = (err as Error).message || 'Print failed';
    logger.error(`print:ticket failed: ${message}`);
    return { ok: false, error: message };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.destroy();
    }
  }
}
