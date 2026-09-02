import type { PrinterInfo } from '@weight/shared/types/index';
import { BrowserWindow } from 'electron';

export async function listPrinters(): Promise<{ printers: PrinterInfo[] }> {
  const win =
    BrowserWindow.getFocusedWindow() ??
    BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) ??
    null;

  if (!win) {
    return { printers: [] };
  }

  const printers = await win.webContents.getPrintersAsync();
  const mapped: PrinterInfo[] = printers.map((p) => {
    const info = p as typeof p & { isDefault?: boolean };
    return {
      name: info.name,
      displayName: info.displayName || info.name,
      isDefault: Boolean(info.isDefault),
    };
  });

  mapped.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return a.displayName.localeCompare(b.displayName);
  });

  return { printers: mapped };
}
