import { paperSizeOptions } from '@weight/shared/constants/index';
import type {
  PaperSizeGroup,
  PrinterInfo,
  PrintersGrouped,
  Record as WeightRecord,
} from '@weight/shared/types/index';
import { Printer } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DialogScrollBody } from '@/components/history/shared/dialog-scroll-body';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export type PrinterDialogMode = 'print' | 'configure';

export interface PrinterSelection {
  printerName: string;
  paperSize: PaperSizeGroup;
  copies: number;
  saveAsDefault: boolean;
}

interface PrinterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PrinterDialogMode;
  record?: WeightRecord | null;
  defaultPrinterName?: string;
  defaultPaperSize?: PaperSizeGroup;
  defaultCopies?: number;
  allowSaveDefault?: boolean;
  onConfirm: (selection: PrinterSelection) => void | Promise<void>;
}

const EMPTY_GROUPS = Object.fromEntries(
  paperSizeOptions.map((o) => [o.value, [] as PrinterInfo[]]),
) as PrintersGrouped;

export function PrinterDialog({
  open,
  onOpenChange,
  mode,
  record,
  defaultPrinterName = '',
  defaultPaperSize = '80mm',
  defaultCopies = 1,
  allowSaveDefault = false,
  onConfirm,
}: PrinterDialogProps) {
  const [groups, setGroups] = useState<PrintersGrouped>(EMPTY_GROUPS);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSizeGroup>(defaultPaperSize);
  const [printerName, setPrinterName] = useState(defaultPrinterName);
  const [copies, setCopies] = useState(defaultCopies);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  useEffect(() => {
    if (!open) return;

    setPaperSize(defaultPaperSize);
    setPrinterName(defaultPrinterName);
    setCopies(defaultCopies);
    setSaveAsDefault(false);

    let cancelled = false;
    setIsLoadingPrinters(true);

    void window.electronAPI
      .listPrintersGrouped()
      .then((result) => {
        if (!cancelled) setGroups(result.groups);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to list printers');
          setGroups(EMPTY_GROUPS);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrinters(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, defaultPaperSize, defaultPrinterName, defaultCopies]);

  const printersInGroup = useMemo(() => groups[paperSize] ?? [], [groups, paperSize]);

  useEffect(() => {
    if (!open) return;
    if (printersInGroup.some((p) => p.name === printerName)) return;
    const fallback =
      printersInGroup.find((p) => p.isDefault)?.name ?? printersInGroup[0]?.name ?? '';
    setPrinterName(fallback);
  }, [open, printersInGroup, printerName]);

  async function handleConfirm() {
    if (!printerName) {
      toast.error('Select a printer');
      return;
    }
    if (mode === 'print' && !record) {
      toast.error('No ticket to print');
      return;
    }

    const selection: PrinterSelection = {
      printerName,
      paperSize,
      copies: Math.max(1, Math.floor(copies) || 1),
      saveAsDefault,
    };

    setIsSubmitting(true);
    try {
      if (mode === 'print' && record) {
        const result = await window.electronAPI.printTicket({
          printerName: selection.printerName,
          paperSize: selection.paperSize,
          copies: selection.copies,
          recordId: record.id,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success('Ticket sent to printer');
      }

      await onConfirm(selection);
      onOpenChange(false);
    } catch (error) {
      toast.error((error as Error).message || 'Print action failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5" />
            {mode === 'print' ? 'Print Ticket' : 'Choose Printer'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'print'
              ? `Print weigh slip${record ? ` for ${record.ticketId}` : ''}.`
              : 'Pick the default printer and paper size for this station.'}
          </DialogDescription>
        </DialogHeader>

        <DialogScrollBody>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="print-paper-size">Paper size</Label>
              <Select
                value={paperSize}
                onValueChange={(value) => setPaperSize(value as PaperSizeGroup)}
              >
                <SelectTrigger id="print-paper-size" className="min-h-11">
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  {paperSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      <span className="ml-2 text-muted-foreground">
                        ({groups[option.value]?.length ?? 0})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Printers ({paperSize})</Label>
              {isLoadingPrinters ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Spinner className="size-4" />
                  Loading printers…
                </div>
              ) : printersInGroup.length === 0 ? (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                  No printers matched this paper size. Try another size group, or install the
                  printer driver.
                </p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
                  {printersInGroup.map((printer) => {
                    const selected = printer.name === printerName;
                    return (
                      <li key={printer.name}>
                        <button
                          type="button"
                          onClick={() => setPrinterName(printer.name)}
                          className={cn(
                            'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                            selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60',
                          )}
                        >
                          <span className="truncate font-medium">{printer.displayName}</span>
                          {printer.isDefault && (
                            <span
                              className={cn(
                                'shrink-0 text-[10px] uppercase tracking-wide',
                                selected ? 'text-primary-foreground/80' : 'text-muted-foreground',
                              )}
                            >
                              Default
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="print-copies">Copies</Label>
              <Input
                id="print-copies"
                type="number"
                min={1}
                max={20}
                className="min-h-11"
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value) || 1)}
              />
            </div>

            {allowSaveDefault && (
              <div className="flex items-center gap-2 text-sm">
                <Checkbox
                  id="save-as-default-printer"
                  checked={saveAsDefault}
                  onCheckedChange={(checked) => setSaveAsDefault(checked === true)}
                />
                <Label htmlFor="save-as-default-printer" className="font-normal">
                  Remember as default printer settings
                </Label>
              </div>
            )}
          </div>
        </DialogScrollBody>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting || !printerName || isLoadingPrinters}
            onClick={() => void handleConfirm()}
          >
            {isSubmitting ? (
              <>
                <Spinner />
                {mode === 'print' ? 'Printing…' : 'Saving…'}
              </>
            ) : mode === 'print' ? (
              'Print'
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
