import type { PaperSizeGroup, PrintTicketResult } from '@weight/shared/types/index';
import { BrowserWindow } from 'electron';
import { logger } from '../logger.js';
import { buildSlipForRecord } from './load-print-context.js';

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

  const slip = buildSlipForRecord(input.recordId, input.paperSize);
  if (!slip.ok) {
    return { ok: false, error: slip.error };
  }

  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  try {
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(slip.html)}`);

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
