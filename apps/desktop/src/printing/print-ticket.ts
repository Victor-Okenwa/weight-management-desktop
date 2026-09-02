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

    const printOptions = {
      silent: true,
      printBackground: true,
      deviceName: matched.name,
      copies,
      // Use the page's own @page CSS margins instead of the driver's default
      // margins; on some thermal printer drivers the default margin is
      // added on top of/instead of our CSS margin, shrinking the real
      // printable width and clipping right-anchored content.
      margins: { marginType: 'none' as const },
    };

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/ae86dde8-539a-4041-add6-1f0ce25a4703', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '81ac12' },
      body: JSON.stringify({
        sessionId: '81ac12',
        runId: 'run1',
        hypothesisId: 'H-margins',
        location: 'print-ticket.ts:printOptions',
        message: 'print options sent to webContents.print',
        data: {
          paperSize: input.paperSize,
          matchedPrinter: matched.name,
          matchedDisplayName: matched.displayName,
          printOptions,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    await new Promise<void>((resolve, reject) => {
      printWindow.webContents.print(printOptions, (success, failureReason) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/ae86dde8-539a-4041-add6-1f0ce25a4703', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '81ac12' },
          body: JSON.stringify({
            sessionId: '81ac12',
            runId: 'run1',
            hypothesisId: 'H-margins',
            location: 'print-ticket.ts:print-callback',
            message: 'print callback result',
            data: { success, failureReason },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion agent log
        if (success) resolve();
        else reject(new Error(failureReason || 'Print failed'));
      });
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
