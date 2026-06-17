// renderer/src/routes/new-weight-dialog.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateRecordInput } from '@weight/database/repositories/record';
import type { Material, Vehicle, WeightReading } from '@weight/shared/types/index';
import { AsteriskIcon, Check, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { useWeightDialogsStore } from '@/store/weightDialog';
import { useWeightStore } from '@/store/weightStore';

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <span>
      {children}
      <span className="text-red-600 pl-0.5" aria-hidden="true">*</span>
    </span>
  );
}

const WEIGHT_UNITS = ['kg', 't', 'lb'] as const;

const schema = z.object({
  weighingType: z.enum(['single', 'double'], { message: 'Weighing type is required' }),
  vehicleMode: z.enum(['existing', 'new']).optional(),
  selectedVehicleId: z.coerce.number().optional(),
  vehicleName: z.string().min(1, 'Vehicle number is required').transform((v) => v.trim()),
  materialName: z.string().optional().transform((v) => v?.trim()),
  operator: z.string().optional().transform((v) => v?.trim()),
  remark: z.string().optional().transform((v) => v?.trim()),
  tareWeight: z.coerce.number().positive('Tare weight must be greater than 0').optional(),
  tareUnit: z.enum(WEIGHT_UNITS).optional(),
  grossWeight: z.coerce.number().positive('Gross weight must be greater than 0').optional(),
  netWeight: z.coerce.number().optional(),
  ticketId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// --- Sub-components (VehicleComboboxField, MaterialComboboxField, ExistingVehicleComboboxField, WeightFormFields) remain exactly the same as in your original code ---
// They are omitted here for brevity, but you must keep them in the file.

export function NewWeightDialog() {
  const { isNewWeightDialogOpen, setNewWeightDialogOpen } = useWeightDialogsStore();
  const { settings, loadSettings } = useSettingsStore();
  const latestReading = useWeightStore((s) => s.latestReading);
  const serialStatus = useWeightStore((s) => s.serialStatus);
  const setLatestReading = useWeightStore((s) => s.setLatestReading);
  const setSerialStatus = useWeightStore((s) => s.setSerialStatus);

  const [stepIndex, setStepIndex] = useState(0);   // index in the stepper array
  const [isSaving, setIsSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [capturedGross, setCapturedGross] = useState<number | null>(null);
  const [capturedGrossUnit, setCapturedGrossUnit] = useState<string | null>(null);
  const [capturedGrossStable, setCapturedGrossStable] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      weighingType: undefined,
      vehicleMode: undefined,
      selectedVehicleId: undefined,
      vehicleName: '',
      materialName: '',
      operator: '',
      remark: '',
      tareWeight: undefined,
      tareUnit: undefined,
      grossWeight: undefined,
      netWeight: undefined,
      ticketId: '',
    },
  });

  const weighingType = form.watch('weighingType');
  const vehicleMode = form.watch('vehicleMode');
  const selectedVehicleId = form.watch('selectedVehicleId');
  const isSingle = weighingType === 'single';
  const isDouble = weighingType === 'double';

  // Map stepper array index to actual content step
  const getRealStep = useCallback(
    (stepperIdx: number) => (isSingle && stepperIdx === 1 ? 2 : stepperIdx),
    [isSingle],
  );
  const realStep = getRealStep(stepIndex);

  const selectedVehicleForTare = useMemo(() => {
    if (vehicleMode === 'existing' && selectedVehicleId) {
      return vehicles.find((v) => v.id === selectedVehicleId) ?? null;
    }
    return null;
  }, [vehicleMode, selectedVehicleId, vehicles]);

  const stepperSteps = useMemo(() => {
    if (isSingle) {
      return [
        { label: 'Step 1', subLabel: 'Weighing Type' },
        { label: 'Step 3', subLabel: 'Record Tare Weight' },
      ];
    }
    return [
      { label: 'Step 1', subLabel: 'Weighing Type' },
      { label: 'Step 2', subLabel: 'Vehicle Selection' },
      { label: 'Step 3', subLabel: 'Record Tare Weight' },
      { label: 'Step 4', subLabel: 'Gross Weight' },
    ];
  }, [isSingle]);

  const ticketId = useMemo(() => {
    const prefix = settings?.ticketPrefix ?? 'TKT';
    const num = settings?.nextTicketNumber ?? 1;
    return `${prefix}-${String(num).padStart(4, '0')}`;
  }, [settings]);

  const loadLookups = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [veh, mat] = await Promise.all([
        window.electronAPI.getAllVehicles(),
        window.electronAPI.getAllMaterials(),
      ]);
      setVehicles(veh);
      setMaterials(mat);
    } catch (err) {
      logger('error', (err as Error).message);
      toast.error('Failed to load vehicles / materials.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Reset on open
  useEffect(() => {
    if (isNewWeightDialogOpen) {
      setStepIndex(0);
      setCapturedGross(null);
      setCapturedGrossUnit(null);
      setCapturedGrossStable(false);
      form.reset({
        weighingType: undefined,
        vehicleMode: undefined,
        selectedVehicleId: undefined,
        vehicleName: '',
        materialName: '',
        operator: '',
        remark: '',
        tareWeight: undefined,
        tareUnit: undefined,
        grossWeight: undefined,
        netWeight: undefined,
        ticketId: '',
      });
      loadSettings();
      loadLookups();
    }
  }, [isNewWeightDialogOpen, loadSettings, loadLookups, form]);

  // Subscribe to weight updates (only on step 4 in double mode)
  useEffect(() => {
    if (!isDouble || realStep !== 3) return;
    const unsub = window.electronAPI.onWeightUpdate((reading: WeightReading) => {
      setLatestReading(reading);
    });
    return () => { unsub(); };
  }, [isDouble, realStep, setLatestReading]);

  useEffect(() => {
    if (!isDouble || realStep !== 3) return;
    const unsubStatus = window.electronAPI.onSerialStatus((status) => {
      setSerialStatus(status);
    });
    return () => { unsubStatus(); };
  }, [isDouble, realStep, setSerialStatus]);

  // Navigation
  const handleNext = useCallback(async () => {
    let fields: (keyof FormValues)[] = [];
    if (realStep === 0) {
      fields = ['weighingType'];
    } else if (realStep === 1 && isDouble) {
      fields = ['vehicleMode'];
      if (vehicleMode === 'existing') fields.push('selectedVehicleId');
    } else if (realStep === 2) {
      fields = ['vehicleName', 'materialName', 'operator', 'remark'];
      if (isSingle) fields.push('tareWeight', 'tareUnit');
    } else if (realStep === 3) {
      fields = ['grossWeight'];
    }

    const isValid = await form.trigger(fields);
    if (!isValid) {
      toast.info('Please complete all required fields.');
      return;
    }

    if (isSingle) {
      if (stepIndex === 0) setStepIndex(1);   // stepper 1 -> real step 2
    } else {
      if (realStep < 3) setStepIndex((prev) => prev + 1);
    }
  }, [realStep, stepIndex, isSingle, isDouble, vehicleMode, form]);

  const handlePrev = useCallback(() => {
    if (isSingle) {
      if (stepIndex === 1) setStepIndex(0);
    } else {
      if (stepIndex > 0) setStepIndex((prev) => prev - 1);
    }
  }, [isSingle, stepIndex]);

  const handleSaveExit = useCallback(async () => {
    try {
      setIsSaving(true);
      const data = form.getValues();

      const payload: CreateRecordInput = {
        operationType: data.weighingType!,
        vehicleName: data.vehicleName || undefined,
        materialName: data.materialName || undefined,
        operator: data.operator || undefined,
        remark: data.remark || undefined,
        status: 'pending',
      };

      if (data.weighingType === 'single' && data.tareWeight != null && data.tareUnit) {
        payload.tareWeight = data.tareWeight;
        payload.vehicleTareWeight = data.tareWeight;
        payload.vehicleTareUnit = data.tareUnit;
      }

      if (data.weighingType === 'double') {
        if (vehicleMode === 'existing' && selectedVehicleForTare) {
          payload.tareWeight = selectedVehicleForTare.tareWeight;
          payload.vehicleTareWeight = selectedVehicleForTare.tareWeight;
          payload.vehicleTareUnit = selectedVehicleForTare.tareUnit;
        } else if (vehicleMode === 'new' && capturedGross !== null && capturedGrossStable) {
          const tare = data.tareWeight ?? 0;
          payload.tareWeight = tare;
          payload.grossWeight = capturedGross;
          payload.netWeight = capturedGross - tare;
        }
      }

      await window.electronAPI.createRecord(payload);
      toast.success('Record saved successfully');
      setNewWeightDialogOpen(false);
    } catch (err) {
      logger('error', (err as Error).message);
      toast.error('Failed to save record.');
    } finally {
      setIsSaving(false);
    }
  }, [form, vehicleMode, selectedVehicleForTare, capturedGross, capturedGrossStable, setNewWeightDialogOpen]);

  const handleComplete = useCallback(async () => {
    try {
      const valid = await form.trigger(['grossWeight']);
      if (!valid) {
        toast.info('Please capture a gross weight before completing.');
        return;
      }
      setIsSaving(true);
      const data = form.getValues();
      const tare = data.tareWeight ?? selectedVehicleForTare?.tareWeight ?? 0;
      const net = (capturedGross ?? 0) - tare;

      const payload: CreateRecordInput = {
        operationType: data.weighingType!,
        vehicleName: data.vehicleName || undefined,
        materialName: data.materialName || undefined,
        operator: data.operator || undefined,
        remark: data.remark || undefined,
        status: 'completed',
        grossWeight: capturedGross ?? undefined,
        tareWeight: tare || null,
        netWeight: net,
        vehicleTareWeight: selectedVehicleForTare?.tareWeight ?? data.tareWeight ?? null,
        vehicleTareUnit: selectedVehicleForTare?.tareUnit ?? data.tareUnit ?? null,
      };

      await window.electronAPI.createRecord(payload);
      toast.success('Record completed successfully');
      setNewWeightDialogOpen(false);
    } catch (err) {
      logger('error', (err as Error).message);
      toast.error('Failed to complete record.');
    } finally {
      setIsSaving(false);
    }
  }, [form, capturedGross, selectedVehicleForTare, setNewWeightDialogOpen]);

  const handleCaptureGross = useCallback(() => {
    if (!latestReading?.isStable) {
      toast.info('Please wait for a stable weight reading.');
      return;
    }
    setCapturedGross(latestReading.weight);
    setCapturedGrossUnit(latestReading.unit);
    setCapturedGrossStable(true);
    toast.success(`Gross weight captured: ${latestReading.weight} ${latestReading.unit}`);
  }, [latestReading]);

  const isSaveEnabled = (isSingle && realStep === 2) || (isDouble && realStep >= 2);

  // Stepper click
  const handleStepClick = (idx: number) => {
    if (idx <= stepIndex) setStepIndex(idx);
  };

  const isStepActive = (idx: number) => stepIndex === idx;
  const isStepCompleted = (idx: number) => stepIndex > idx;

  const renderStepper = () => (
    <div className="flex items-start justify-between gap-2 overflow-x-auto">
      {stepperSteps.map((step, idx) => {
        const completed = isStepCompleted(idx);
        const active = isStepActive(idx);
        return (
          <div key={step.label} className="flex items-center w-full">
            <button
              type="button"
              onClick={() => handleStepClick(idx)}
              className="group flex flex-col items-center text-center"
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-full border-2 font-semibold transition-all',
                  completed && 'border-green-500 bg-green-500 text-white',
                  active && 'border-primary bg-primary text-white',
                  !completed && !active && 'bg-background text-muted-foreground',
                )}
              >
                {completed ? <Check className="size-4" /> : idx + 1}
              </div>
              <div className="mt-2">
                <p className={cn('text-xs font-semibold', active && 'text-primary', completed && 'text-green-600')}>
                  {step.label}
                </p>
                <p className="text-muted-foreground text-xs">{step.subLabel}</p>
              </div>
            </button>
            {idx < stepperSteps.length - 1 && <div className="mx-2 h-[1.5px] flex-1 bg-border w-full!" />}
          </div>
        );
      })}
    </div>
  );

  const renderStepContent = () => {
    if (realStep === 0) {
      return (
        <div className="space-y-4">
          <Controller
            name="weighingType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel><RequiredLabel>Weighing Type</RequiredLabel></FieldLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-4">
                  <div
                    className={cn('flex items-center gap-3 rounded-lg border border-input p-4', {
                      'bg-foreground text-background!': field.value === 'single',
                    })}
                  >
                    <RadioGroupItem value="single" id="single" />
                    <label htmlFor="single" className="text-sm font-medium cursor-pointer">
                      Single Weighing
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Record/update vehicle tare weight only.
                      </p>
                    </label>
                  </div>
                  <div
                    className={cn('flex items-center gap-3 rounded-lg border border-input p-4', {
                      'bg-foreground text-background!': field.value === 'double',
                    })}
                  >
                    <RadioGroupItem value="double" id="double" />
                    <label htmlFor="double" className="text-sm font-medium cursor-pointer">
                      Double Weighing
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Full gross/tare/net workflow.
                      </p>
                    </label>
                  </div>
                </RadioGroup>
                <FieldDescription>
                  Single weighing records only a vehicle&apos;s tare weight. Double weighing completes the full weight workflow.
                </FieldDescription>
              </Field>
            )}
          />
        </div>
      );
    }

    if (realStep === 1 && isDouble) {
      return (
        <div className="space-y-4">
          <Controller
            name="vehicleMode"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel><RequiredLabel>Tare Weight Source</RequiredLabel></FieldLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 rounded-lg border border-input p-4">
                    <RadioGroupItem value="existing" id="existing" />
                    <label htmlFor="existing" className="text-sm font-medium cursor-pointer">
                      Use existing tare weight
                    </label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-input p-4">
                    <RadioGroupItem value="new" id="new" />
                    <label htmlFor="new" className="text-sm font-medium cursor-pointer">
                      Record new weight
                    </label>
                  </div>
                </RadioGroup>
                <FieldDescription>
                  Choose whether to use a stored tare weight from an existing vehicle or record a new one from the scale.
                </FieldDescription>
              </Field>
            )}
          />
          {vehicleMode === 'existing' && (
            <ExistingVehicleComboboxField
              vehicles={vehicles}
              control={form.control}
              form={form}
              error={form.formState.errors.selectedVehicleId}
            />
          )}
        </div>
      );
    }

    if (realStep === 2) {
      const showTareFields = isSingle || (isDouble && vehicleMode === 'new');
      return (
        <div className="space-y-4">
          <WeightFormFields
            form={form}
            vehicles={vehicles}
            materials={materials}
            showTareFields={showTareFields}
            ticketId={ticketId}
          />
          {isDouble && vehicleMode === 'new' && (
            <div className="rounded-md border border-input bg-accent/30 p-3 text-sm text-muted-foreground">
              <strong>Note:</strong> Tare weight will be captured from the scale in the next step.
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderStep4Content = () => {
    const displayGross = capturedGross ?? latestReading?.weight ?? null;
    const isStableNow = (capturedGrossStable || latestReading?.isStable) ?? false;
    const tareValue = (() => {
      if (vehicleMode === 'existing' && selectedVehicleForTare?.tareWeight) return selectedVehicleForTare.tareWeight;
      const manual = form.getValues('tareWeight');
      return manual ?? null;
    })();
    const tareUnit = (() => {
      if (vehicleMode === 'existing' && selectedVehicleForTare?.tareUnit) return selectedVehicleForTare.tareUnit;
      return form.getValues('tareUnit');
    })();
    const netValue = displayGross != null && tareValue != null ? displayGross - tareValue : null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <WeightFormFields form={form} vehicles={vehicles} materials={materials} showTareFields={false} ticketId={ticketId} />
          </div>
          <Card className="col-span-1 lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
              <div>
                <span className="text-xs font-medium uppercase text-muted-foreground">Tare Weight</span>
                <p className="mt-1 text-2xl font-semibold">
                  {tareValue != null ? `${tareValue} ${tareUnit ?? ''}` : '—'}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-muted-foreground">Gross Weight</span>
                <div className="mt-1 flex items-center gap-3">
                  <p className={cn('text-2xl font-semibold', isStableNow && displayGross != null ? 'text-green-600' : 'text-foreground')}>
                    {displayGross != null ? `${displayGross} ${capturedGrossUnit ?? latestReading?.unit ?? ''}` : '—'}
                  </p>
                  {latestReading && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                        latestReading.isStable
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', latestReading.isStable ? 'bg-green-600' : 'bg-amber-600')} />
                      {latestReading.isStable ? 'Stable' : 'Unstable'}
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleCaptureGross}
                    disabled={capturedGrossStable || !latestReading || latestReading.weight <= 0 || serialStatus !== 'connected'}
                  >
                    {capturedGrossStable ? 'Captured' : 'Capture'}
                  </Button>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-muted-foreground">Net Weight</span>
                <p className="mt-1 text-2xl font-semibold">
                  {netValue != null ? `${netValue} ${tareUnit ?? ''}` : '—'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <AlertDialog open={isNewWeightDialogOpen} onOpenChange={setNewWeightDialogOpen}>
      <AlertDialogContent className="min-w-[90%] max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogCancel className="absolute top-2 right-2">
            <X />
          </AlertDialogCancel>
          <AlertDialogTitle>Record New Weight</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-1">
            <span className="flex items-center">
              Make sure to fill in all required fields marked by <AsteriskIcon className="text-red-500" />.
            </span>
            Make sure indicator is connected and displaying correct live weight. It is best to record weight when the traffic light is green (Stable).
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="mt-6 px-1">{renderStepper()}</div>

        <form
          onSubmit={form.handleSubmit(async () => {
            if (isDouble && realStep === 3) await handleComplete();
          })}
          className="mt-6 bg-accent/20 px-6 py-5 rounded-lg"
        >
          <div className="flex items-center mb-6 gap-2 text-muted-foreground text-sm">
            <span><span className="text-destructive">*</span> Indicates required field</span>
          </div>

          {isLoadingData && <p className="text-sm text-muted-foreground">Loading vehicles and materials...</p>}

          {!isLoadingData && (
            <>
              {isDouble && realStep === 3 ? renderStep4Content() : renderStepContent()}

              <div className="mt-8 flex items-center justify-between">
                <div>
                  {((isDouble && stepIndex > 0) || (isSingle && stepIndex === 1)) && (
                    <Button type="button" variant="outline" onClick={handlePrev} className="min-h-10">
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(isSaveEnabled || (isDouble && realStep === 3)) && (
                    <Button type="button" variant="secondary" onClick={handleSaveExit} disabled={isSaving} className="min-h-10">
                      Save & Exit
                    </Button>
                  )}
                  {isDouble && realStep === 3 ? (
                    <Button type="submit" disabled={isSaving} className="min-h-10">
                      Complete
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleNext} className="min-h-10">
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default NewWeightDialog;