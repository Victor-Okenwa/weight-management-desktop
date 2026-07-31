import type { PaperSizeGroup, Record as WeightRecord, SettingsRow } from '@weight/shared/types/index';
import { toast } from 'sonner';

/** Silent print using saved defaults. Returns true if print was attempted (and succeeded). */
export async function tryAutoPrintRecord(
  record: WeightRecord,
  settings: SettingsRow | null | undefined,
): Promise<boolean> {
  if (!settings?.printAuto || !settings.printPrinterName?.trim()) {
    return false;
  }

  const result = await window.electronAPI.printTicket({
    printerName: settings.printPrinterName,
    paperSize: (settings.printPaperSize || '80mm') as PaperSizeGroup,
    copies: settings.printCopies || 1,
    recordId: record.id,
  });

  if (!result.ok) {
    toast.error(result.error || 'Auto-print failed');
    return false;
  }

  toast.success('Ticket sent to printer');
  return true;
}

export async function savePrintDefaults(selection: {
  printerName: string;
  paperSize: PaperSizeGroup;
  copies: number;
}): Promise<void> {
  await window.electronAPI.updateSettings({
    printPrinterName: selection.printerName,
    printPaperSize: selection.paperSize,
    printCopies: selection.copies,
  });
}
