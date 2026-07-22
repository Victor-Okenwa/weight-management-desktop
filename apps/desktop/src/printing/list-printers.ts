import type { PrintersGrouped } from '@weight/shared/types/index';
import { BrowserWindow } from 'electron';
import { groupPrinters } from './group-printers.js';

export async function listPrintersGrouped(): Promise<{ groups: PrintersGrouped }> {
  const win =
    BrowserWindow.getFocusedWindow() ??
    BrowserWindow.getAllWindows().find((w) => !w.isDestroyed()) ??
    null;

  if (!win) {
    return { groups: groupPrinters([]) };
  }

  const printers = await win.webContents.getPrintersAsync();
  return {
    groups: groupPrinters(
      printers.map((p) => {
        const info = p as typeof p & { isDefault?: boolean };
        return {
          name: info.name,
          displayName: info.displayName,
          description: info.description,
          isDefault: Boolean(info.isDefault),
        };
      }),
    ),
  };
}
