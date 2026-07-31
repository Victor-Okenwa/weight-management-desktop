import { paperSizeOptions } from '@weight/shared/constants/index';
import type { PaperSizeGroup } from '@weight/shared/types/index';
import { Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PrinterDialog, type PrinterSelection } from '@/components/printer-dialog';
import { useSettingsStore } from '@/store/settingsStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Spinner } from './ui/spinner';

export function PrintSettingsTab() {
  const { settings, loadSettings } = useSettingsStore();
  const [printAuto, setPrintAuto] = useState(settings?.printAuto ?? false);
  const [printPaperSize, setPrintPaperSize] = useState<PaperSizeGroup>(
    settings?.printPaperSize ?? '80mm',
  );
  const [printCopies, setPrintCopies] = useState(settings?.printCopies ?? 1);
  const [printPrinterName, setPrintPrinterName] = useState(settings?.printPrinterName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [printerDialogOpen, setPrinterDialogOpen] = useState(false);

  useEffect(() => {
    setPrintAuto(settings?.printAuto ?? false);
    setPrintPaperSize(settings?.printPaperSize ?? '80mm');
    setPrintCopies(settings?.printCopies ?? 1);
    setPrintPrinterName(settings?.printPrinterName ?? '');
  }, [settings]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await window.electronAPI.updateSettings({
        printAuto,
        printPaperSize,
        printCopies: Math.max(1, Math.floor(printCopies) || 1),
        printPrinterName,
      });
      await loadSettings();
      toast.success('Print settings updated');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update print settings');
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePrinterConfirm(selection: PrinterSelection) {
    setPrintPrinterName(selection.printerName);
    setPrintPaperSize(selection.paperSize);
    setPrintCopies(selection.copies);

    await window.electronAPI.updateSettings({
      printPrinterName: selection.printerName,
      printPaperSize: selection.paperSize,
      printCopies: selection.copies,
      printAuto,
    });
    await loadSettings();
    toast.success('Default printer saved');
  }

  return (
    <article className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="size-5" />
            Print Settings
          </CardTitle>
          <CardDescription>
            Configure auto-print, default paper size, copies, and the station printer. Defaults are
            seeded; change them here when the scale house printer is connected.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 rounded-lg border px-3 py-3 text-sm">
            <Checkbox
              id="print-auto-setting"
              checked={printAuto}
              onCheckedChange={(checked) => setPrintAuto(checked === true)}
              className="mt-0.5"
            />
            <div>
              <Label htmlFor="print-auto-setting" className="font-medium">
                Auto print on complete
              </Label>
              <p className="text-muted-foreground">
                When enabled and a default printer is set, completed weigh-ins print without opening
                the dialog.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="print-paper-size-setting">Default paper size</Label>
              <Select
                value={printPaperSize}
                onValueChange={(value) => setPrintPaperSize(value as PaperSizeGroup)}
              >
                <SelectTrigger id="print-paper-size-setting" className="min-h-12">
                  <SelectValue placeholder="Select paper size" />
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

            <div className="space-y-2">
              <Label htmlFor="print-copies-setting">Default copies</Label>
              <Input
                id="print-copies-setting"
                type="number"
                min={1}
                max={20}
                className="min-h-12"
                value={printCopies}
                onChange={(e) => setPrintCopies(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default printer</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="min-h-12 flex-1 rounded-lg border bg-muted/30 px-3 py-3 text-sm">
                {printPrinterName.trim() || (
                  <span className="text-muted-foreground">No printer selected</span>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setPrinterDialogOpen(true)}
              >
                Choose printer…
              </Button>
            </div>
          </div>

          <div className="flex justify-end border-t border-border/60 pt-5">
            <Button type="button" size="lg" disabled={isSaving} onClick={() => void handleSave()}>
              {isSaving ? (
                <>
                  <Spinner /> Saving…
                </>
              ) : (
                'Save print settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrinterDialog
        open={printerDialogOpen}
        onOpenChange={setPrinterDialogOpen}
        mode="configure"
        defaultPrinterName={printPrinterName}
        defaultPaperSize={printPaperSize}
        defaultCopies={printCopies}
        onConfirm={handlePrinterConfirm}
      />
    </article>
  );
}
