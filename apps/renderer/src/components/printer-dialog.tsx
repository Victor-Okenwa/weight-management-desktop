import { paperSizeOptions } from '@weight/shared/constants/index';
import type { PaperSizeGroup, PrinterInfo, Record as WeightRecord } from '@weight/shared/types/index';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
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

function previewWidthClass(paperSize: PaperSizeGroup): string {
  switch (paperSize) {
    case '58mm':
      return 'w-[200px]';
    case 'A4':
      return 'w-full max-w-[360px]';
    case '80mm':
    default:
      return 'w-[260px]';
  }
}

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
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paperSize, setPaperSize] = useState<PaperSizeGroup>(defaultPaperSize);
  const [printerName, setPrinterName] = useState(defaultPrinterName);
  const [copies, setCopies] = useState(defaultCopies);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setPaperSize(defaultPaperSize);
    setPrinterName(defaultPrinterName);
    setCopies(defaultCopies);
    setSaveAsDefault(false);
    setPreviewHtml('');
    setPreviewError(null);

    let cancelled = false;
    setIsLoadingPrinters(true);

    void window.electronAPI
      .listPrinters()
      .then((result) => {
        if (!cancelled) setPrinters(result.printers);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to list printers');
          setPrinters([]);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPrinters(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, defaultPaperSize, defaultPrinterName, defaultCopies]);

  useEffect(() => {
    if (!open) return;
    if (printers.some((p) => p.name === printerName)) return;
    const fallback = printers.find((p) => p.isDefault)?.name ?? printers[0]?.name ?? '';
    setPrinterName(fallback);
  }, [open, printers, printerName]);

  useEffect(() => {
    if (!open || mode !== 'print' || !record) {
      setPreviewHtml('');
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingPreview(true);
    setPreviewError(null);

    void window.electronAPI
      .previewTicket({ recordId: record.id, paperSize })
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setPreviewHtml('');
          setPreviewError(result.error);
          return;
        }
        setPreviewHtml(result.html);
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewHtml('');
          setPreviewError('Failed to load print preview');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, mode, record, paperSize]);

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
      <DialogContent
        className={cn(
          'flex max-h-[92vh] w-full flex-col gap-4 overflow-hidden',
          mode === 'print' ? 'max-w-[calc(100%-2rem)] sm:max-w-6xl' : 'max-w-lg sm:max-w-xl',
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="size-5" />
            {mode === 'print' ? 'Print Ticket' : 'Choose Printer'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'print'
              ? `Print weigh slip${record ? ` for ${record.ticketId}` : ''}.`
              : 'Pick the default printer for this station.'}
          </DialogDescription>
        </DialogHeader>

        <DialogScrollBody
          className="min-h-0 flex-1 overflow-y-auto"
          maxHeightClassName="max-h-[min(72vh,44rem)]"
        >
          <div
            className={cn(
              'gap-6',
              mode === 'print' ? 'grid grid-cols-1 md:grid-cols-[1fr_minmax(240px,320px)]' : '',
            )}
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="print-printer-select">Select printer</Label>
                <Select
                  value={printerName}
                  onValueChange={setPrinterName}
                  disabled={isLoadingPrinters || printers.length === 0}
                >
                  <SelectTrigger id="print-printer-select" className="min-h-11">
                    <SelectValue
                      placeholder={isLoadingPrinters ? 'Loading printers…' : 'Select a printer'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {printers.map((printer) => (
                      <SelectItem key={printer.name} value={printer.name}>
                        {printer.displayName}
                        {printer.isDefault && (
                          <span className="ml-2 text-muted-foreground">(Default)</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isLoadingPrinters && printers.length === 0 && (
                  <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    No printers found. Install a printer driver and try again.
                  </p>
                )}
              </div>

              {mode === 'print' && (
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
              )}

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

            {mode === 'print' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Preview</Label>
                  <Select
                    value={paperSize}
                    onValueChange={(value) => setPaperSize(value as PaperSizeGroup)}
                  >
                    <SelectTrigger id="print-page-size" className="h-8 w-32 text-xs">
                      <SelectValue placeholder="Page size" />
                    </SelectTrigger>
                    <SelectContent>
                      {paperSizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex max-h-[min(60vh,36rem)] min-h-[320px] items-start justify-center overflow-y-auto rounded-lg border bg-muted/30 p-4">
                  {isLoadingPreview ? (
                    <div className="flex items-center gap-2 py-16 text-sm text-muted-foreground">
                      <Spinner className="size-4" />
                      Loading preview…
                    </div>
                  ) : previewError ? (
                    <p className="py-16 text-center text-sm text-destructive">{previewError}</p>
                  ) : previewHtml ? (
                    <iframe
                      title={`Print preview ${record?.ticketId ?? ''}`.trim()}
                      srcDoc={previewHtml}
                      sandbox=""
                      className={cn(
                        'min-h-[320px] rounded-md border bg-white shadow-sm',
                        previewWidthClass(paperSize),
                      )}
                    />
                  ) : (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      No preview available
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview updates when you change page size. Layout matches the printed slip.
                </p>
              </div>
            )}
          </div>
        </DialogScrollBody>

        <DialogFooter className="shrink-0">
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
