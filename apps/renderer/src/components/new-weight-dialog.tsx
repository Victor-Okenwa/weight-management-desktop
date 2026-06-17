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
import { WeightDisplay } from './weight-display';   // reuse existing live weight display

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
  // tareWeight and tareUnit are no longer user‑filled; they are set programmatically
  tareWeight: z.coerce.number().positive('Tare weight must be greater than 0').optional(),
  tareUnit: z.enum(WEIGHT_UNITS).optional(),
  grossWeight: z.coerce.number().positive('Gross weight must be greater than 0').optional(),
  netWeight: z.coerce.number().optional(),
  ticketId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ------------------------------------------------
// 1. Fixed VehicleComboboxField – saves on blur
// ------------------------------------------------
function VehicleComboboxField({
  vehicles,
  control,
  error,
}: {
  vehicles: Vehicle[];
  control: ReturnType<typeof useForm<FormValues>>['control'];
  error?: { message?: string };
}) {
  const [inputValue, setInputValue] = useState('');

  const filteredVehicles = useMemo(() => {
    if (!inputValue) return vehicles;
    return vehicles.filter((v) => v.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [vehicles, inputValue]);

  return (
    <Controller
      name="vehicleName"
      control={control}
      render={({ field }) => {
        const typed = field.value || '';
        // display the raw value if it's new, otherwise the matched vehicle name
        const displayValue = typed
          ? vehicles.find((v) => v.name.toLowerCase() === typed.toLowerCase())?.name || typed
          : '';

        const handleBlur = () => {
          // On blur, if the user typed something that doesn't exactly match an existing vehicle, treat it as a new vehicle name
          if (inputValue.trim() && !vehicles.some(v => v.name.toLowerCase() === inputValue.trim().toLowerCase())) {
            field.onChange(inputValue.trim());
          } else if (!inputValue.trim()) {
            // if empty, keep existing value
          } else {
            // exact match – ensure it's set (already set by onInputChange)
            field.onChange(inputValue.trim());
          }
          setInputValue(''); // clear internal input after blur
        };

        return (
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="vehicle-name">
              <RequiredLabel>Vehicle Number</RequiredLabel>
            </FieldLabel>
            <Combobox
              value={displayValue}
              onValueChange={(value) => {
                setInputValue(value);
                field.onChange(value);
              }}
              onInputChange={(value) => {
                setInputValue(value);
                // Don't update field yet; only on blur or explicit selection
              }}
            >
              <ComboboxInput id="vehicle-name" showTrigger onBlur={handleBlur} />
              <ComboboxValue placeholder="Select or enter vehicle" />
              <ComboboxContent>
                <ComboboxList>
                  {filteredVehicles.map((v) => (
                    <ComboboxItem key={v.id} value={v.name}>
                      <div className="flex flex-col">
                        <span className="font-medium">{v.name}</span>
                        {v.tareWeight !== null && v.tareUnit && (
                          <span className="text-xs text-muted-foreground">
                            Tare: {v.tareWeight} {v.tareUnit}
                          </span>
                        )}
                      </div>
                    </ComboboxItem>
                  ))}
                  {inputValue &&
                    !vehicles.some((v) => v.name.toLowerCase() === inputValue.toLowerCase()) && (
                      <ComboboxItem value={inputValue}>
                        <span className="flex items-center gap-2 text-sm">
                          <Plus className="size-3.5" />
                          Create new vehicle &quot;{inputValue}&quot;
                        </span>
                      </ComboboxItem>
                    )}
                  {filteredVehicles.length === 0 && !inputValue && (
                    <span className="px-2 py-3 text-sm text-muted-foreground">
                      No vehicles found. Start typing to create.
                    </span>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldDescription>Select an existing vehicle or type a new one.</FieldDescription>
            <FieldError errors={error ? [error] : []} />
          </Field>
        );
      }}
    />
  );
}

// ------------------------------------------------
// 2. Fixed MaterialComboboxField – saves on blur
// ------------------------------------------------
function MaterialComboboxField({
  materials,
  control,
  error,
}: {
  materials: Material[];
  control: ReturnType<typeof useForm<FormValues>>['control'];
  error?: { message?: string };
}) {
  const [inputValue, setInputValue] = useState('');

  const filteredMaterials = useMemo(() => {
    if (!inputValue) return materials;
    return materials.filter((m) => m.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [materials, inputValue]);

  return (
    <Controller
      name="materialName"
      control={control}
      render={({ field }) => {
        const typed = field.value || '';
        const displayValue = typed
          ? materials.find((m) => m.name.toLowerCase() === typed.toLowerCase())?.name || typed
          : '';

        const handleBlur = () => {
          if (inputValue.trim() && !materials.some(m => m.name.toLowerCase() === inputValue.trim().toLowerCase())) {
            field.onChange(inputValue.trim());
          } else if (!inputValue.trim()) {
            // stay
          } else {
            field.onChange(inputValue.trim());
          }
          setInputValue('');
        };

        return (
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="material-name">Material</FieldLabel>
            <Combobox
              value={displayValue}
              onValueChange={(value) => {
                setInputValue(value);
                field.onChange(value);
                console.log(value)
              }}
              onInputChange={(value) => {
                setInputValue(value);
                console.log(value)
              }}
            >
              <ComboboxInput id="material-name" showTrigger onBlur={handleBlur} />
              <ComboboxValue placeholder="Select material" />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxItem value="">None</ComboboxItem>
                  <ComboboxItem value="__create__">
                    <span className="flex items-center gap-2 text-sm">
                      <Plus className="size-3.5" />
                      Create new material
                    </span>
                  </ComboboxItem>
                  <ComboboxItem
                    value="__separator__"
                    disabled
                    className="pointer-events-none opacity-50"
                  >
                    <span className="h-px bg-border block my-1" />
                  </ComboboxItem>
                  {filteredMaterials.map((m) => (
                    <ComboboxItem key={m.id} value={m.name}>
                      <span className="font-medium">{m.name}</span>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldDescription>Material being weighed (optional).</FieldDescription>
            <FieldError errors={error ? [error] : []} />
          </Field>
        );
      }}
    />
  );
}

// ------------------------------------------------
// 3. ExistingVehicleComboboxField – unchanged
// ------------------------------------------------
function ExistingVehicleComboboxField({
  vehicles,
  control,
  form,
  error,
}: {
  vehicles: Vehicle[];
  control: ReturnType<typeof useForm<FormValues>>['control'];
  form: ReturnType<typeof useForm<FormValues>>;
  error?: { message?: string };
}) {
  const [inputValue, setInputValue] = useState('');

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === Number(inputValue)),
    [vehicles, inputValue],
  );

  return (
    <Controller
      name="selectedVehicleId"
      control={control}
      render={({ field }) => (
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="existing-vehicle">
            <RequiredLabel>Existing Vehicle</RequiredLabel>
          </FieldLabel>
          <Combobox
            value={inputValue}
            onValueChange={(val) => {
              if (val) {
                setInputValue(val);
                field.onChange(Number(val));
                form.setValue('vehicleName', selectedVehicle?.name ?? '');
              }
            }}
            onInputChange={(val) => setInputValue(val)}
          >
            <ComboboxInput id="existing-vehicle" showTrigger />
            <ComboboxValue placeholder="Select a vehicle" />
            <ComboboxContent>
              <ComboboxList>
                {vehicles.map((v) => (
                  <ComboboxItem key={v.id} value={String(v.id)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{v.name}</span>
                      {v.tareWeight !== null && v.tareUnit && (
                        <span className="text-xs text-muted-foreground">
                          Tare: {v.tareWeight} {v.tareUnit}
                        </span>
                      )}
                    </div>
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription>Select a vehicle with an existing tare weight.</FieldDescription>
          <FieldError errors={error ? [error] : []} />
        </Field>
      )}
    />
  );
}

// ------------------------------------------------
// 4. WeightFormFields – used in steps 3 and 4
// ------------------------------------------------
interface WeightFormFieldsProps {
  form: ReturnType<typeof useForm<FormValues>>;
  vehicles: Vehicle[];
  materials: Material[];
  showTareCapture: boolean;   // if true, show the live weight capture
  ticketId: string;
}

function WeightFormFields({
  form,
  vehicles,
  materials,
  showTareCapture,
  ticketId,
}: WeightFormFieldsProps) {
  const vehicleError = form.formState.errors.vehicleName;
  const materialError = form.formState.errors.materialName;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Controller
        name="ticketId"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="ticket-id">Ticket ID</FieldLabel>
            <Input
              {...field}
              id="ticket-id"
              className="min-h-12"
              value={ticketId}
              disabled
              placeholder="TKT-0001"
            />
            <FieldDescription>Auto-generated ticket identifier.</FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="operator"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor="operator">Operator</FieldLabel>
            <Input {...field} id="operator" className="min-h-12" placeholder="e.g. John Doe" />
            <FieldDescription>Name of the operator (optional).</FieldDescription>
            <FieldError errors={fieldState.error ? [fieldState.error] : []} />
          </Field>
        )}
      />

      <VehicleComboboxField vehicles={vehicles} control={form.control} error={vehicleError} />

      <MaterialComboboxField materials={materials} control={form.control} error={materialError} />

      {/* No manual tare weight fields */}
      {/* If capture is required, the parent will render the WeightDisplay and capture button */}

      <Controller
        name="remark"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={!!fieldState.error} className="lg:col-span-2">
            <FieldLabel htmlFor="remark">Remark</FieldLabel>
            <Textarea
              {...field}
              id="remark"
              className="min-h-20"
              placeholder="Optional notes..."
              onChange={(e) => field.onChange(e.target.value)}
            />
            <FieldDescription>Any additional notes for this record.</FieldDescription>
            <FieldError errors={fieldState.error ? [fieldState.error] : []} />
          </Field>
        )}
      />
    </div>
  );
}

// ------------------------------------------------
// 5. Main Dialog Component
// ------------------------------------------------
export function NewWeightDialog() {
  const { isNewWeightDialogOpen, setNewWeightDialogOpen } = useWeightDialogsStore();
  const { settings, loadSettings } = useSettingsStore();
  const latestReading = useWeightStore((s) => s.latestReading);
  const serialStatus = useWeightStore((s) => s.serialStatus);
  const setLatestReading = useWeightStore((s) => s.setLatestReading);
  const setSerialStatus = useWeightStore((s) => s.setSerialStatus);

  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Captured tare weight
  const [capturedTareWeight, setCapturedTareWeight] = useState<number | null>(null);
  const [capturedTareUnit, setCapturedTareUnit] = useState<string | null>(null);
  const [capturedTareStable, setCapturedTareStable] = useState(false);

  // Gross weight capture (only for step 4)
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
      setCapturedTareWeight(null);
      setCapturedTareUnit(null);
      setCapturedTareStable(false);
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
        tareUnit: settings?.weightUnit || 'kg',   // default unit from settings
        grossWeight: undefined,
        netWeight: undefined,
        ticketId: '',
      });
      loadSettings();
      loadLookups();
    }
  }, [isNewWeightDialogOpen, loadSettings, loadLookups, form, settings?.weightUnit]);

  // Subscribe to weight updates (only on step 4 in double mode, or step 3 when capturing tare)
  useEffect(() => {
    const needUpdates = (isDouble && realStep === 3) || (realStep === 2 && (isSingle || vehicleMode === 'new'));
    if (!needUpdates) return;
    const unsub = window.electronAPI.onWeightUpdate((reading: WeightReading) => {
      setLatestReading(reading);
    });
    return () => { unsub(); };
  }, [isDouble, realStep, isSingle, vehicleMode, setLatestReading]);

  useEffect(() => {
    const needUpdates = (isDouble && realStep === 3) || (realStep === 2 && (isSingle || vehicleMode === 'new'));
    if (!needUpdates) return;
    const unsubStatus = window.electronAPI.onSerialStatus((status) => {
      setSerialStatus(status);
    });
    return () => { unsubStatus(); };
  }, [isDouble, realStep, isSingle, vehicleMode, setSerialStatus]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    let fields: (keyof FormValues)[] = [];
    if (realStep === 0) {
      fields = ['weighingType'];
    } else if (realStep === 1 && isDouble) {
      fields = ['vehicleMode'];
      if (vehicleMode === 'existing') fields.push('selectedVehicleId');
    } else if (realStep === 2) {
      fields = ['vehicleName', 'materialName', 'operator', 'remark'];
      // No manual tare weight fields; we'll check capturedTareWeight below
    } else if (realStep === 3) {
      fields = ['grossWeight'];
    }

    const isValid = await form.trigger(fields);
    if (!isValid) {
      toast.info('Please complete all required fields.');
      return;
    }

    // Extra validations
    if (realStep === 1 && isDouble && vehicleMode === 'existing') {
      if (!selectedVehicleId || selectedVehicleId <= 0) {
        form.setError('selectedVehicleId', { message: 'Please select an existing vehicle.' });
        return;
      }
    }
    if (realStep === 2 && (isSingle || (isDouble && vehicleMode === 'new'))) {
      // must have captured a tare weight
      if (!capturedTareWeight) {
        toast.info('Please capture a stable tare weight before continuing.');
        return;
      }
    }

    if (isSingle) {
      if (stepIndex === 0) setStepIndex(1);
    } else {
      if (realStep < 3) setStepIndex((prev) => prev + 1);
    }
  }, [realStep, stepIndex, isSingle, isDouble, vehicleMode, selectedVehicleId, capturedTareWeight, form]);

  const handlePrev = useCallback(() => {
    if (isSingle) {
      if (stepIndex === 1) setStepIndex(0);
    } else {
      if (stepIndex > 0) setStepIndex((prev) => prev - 1);
    }
  }, [isSingle, stepIndex]);

  const handleCaptureTare = useCallback(() => {
    if (!latestReading?.isStable) {
      toast.info('Please wait for a stable weight reading.');
      return;
    }
    setCapturedTareWeight(latestReading.weight);
    setCapturedTareUnit(latestReading.unit);
    setCapturedTareStable(true);
    // Update form fields so they are saved later
    form.setValue('tareWeight', latestReading.weight);
    form.setValue('tareUnit', latestReading.unit as typeof WEIGHT_UNITS[number]);
    toast.success(`Tare weight captured: ${latestReading.weight} ${latestReading.unit}`);
  }, [latestReading, form]);

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

      if (data.weighingType === 'single') {
        if (capturedTareWeight != null) {
          payload.tareWeight = capturedTareWeight;
          payload.vehicleTareWeight = capturedTareWeight;
          payload.vehicleTareUnit = capturedTareUnit ?? settings?.weightUnit;
        }
      } else if (data.weighingType === 'double') {
        if (vehicleMode === 'existing' && selectedVehicleForTare) {
          payload.tareWeight = selectedVehicleForTare.tareWeight;
          payload.vehicleTareWeight = selectedVehicleForTare.tareWeight;
          payload.vehicleTareUnit = selectedVehicleForTare.tareUnit;
        } else if (vehicleMode === 'new') {
          // captured tare weight (already set via handleCaptureTare)
          if (capturedTareWeight != null) {
            payload.tareWeight = capturedTareWeight;
            payload.vehicleTareWeight = capturedTareWeight;
            payload.vehicleTareUnit = capturedTareUnit ?? settings?.weightUnit;
          }
          // If also captured gross (maybe in step 4), we could include, but save & exit keeps pending
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
  }, [form, vehicleMode, selectedVehicleForTare, capturedTareWeight, capturedTareUnit, capturedGross, capturedGrossStable, settings?.weightUnit, setNewWeightDialogOpen]);

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
        operationType: 'double',
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
    form.setValue('grossWeight', latestReading.weight);
    toast.success(`Gross weight captured: ${latestReading.weight} ${latestReading.unit}`);
  }, [latestReading, form]);

  const isSaveEnabled = (isSingle && realStep === 2) || (isDouble && realStep >= 2);

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
      // ... (same as original, no changes)
      return (
        <div className="space-y-4">
          <Controller
            name="weighingType"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel><RequiredLabel>Weighing Type</RequiredLabel></FieldLabel>
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-2 gap-4">
                  <div className={cn('flex items-center gap-3 rounded-lg border border-input p-4', {
                    'bg-foreground text-background!': field.value === 'single',
                  })}>
                    <RadioGroupItem value="single" id="single" />
                    <label htmlFor="single" className="text-sm font-medium cursor-pointer">
                      Single Weighing
                      <p className="text-xs text-muted-foreground mt-0.5">Record/update vehicle tare weight only.</p>
                    </label>
                  </div>
                  <div className={cn('flex items-center gap-3 rounded-lg border border-input p-4', {
                    'bg-foreground text-background!': field.value === 'double',
                  })}>
                    <RadioGroupItem value="double" id="double" />
                    <label htmlFor="double" className="text-sm font-medium cursor-pointer">
                      Double Weighing
                      <p className="text-xs text-muted-foreground mt-0.5">Full gross/tare/net workflow.</p>
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
                    <label htmlFor="existing" className="text-sm font-medium cursor-pointer">Use existing tare weight</label>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-input p-4">
                    <RadioGroupItem value="new" id="new" />
                    <label htmlFor="new" className="text-sm font-medium cursor-pointer">Record new weight</label>
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
      // Determine if we need to show tare capture
      const needTareCapture = isSingle || (isDouble && vehicleMode === 'new');
      return (
        <div className="space-y-4">
          <WeightFormFields
            form={form}
            vehicles={vehicles}
            materials={materials}
            showTareCapture={needTareCapture}
            ticketId={ticketId}
          />
          {needTareCapture && (
            <div className="space-y-4">
              {/* Live weight display */}
              <WeightDisplay />
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCaptureTare}
                  disabled={capturedTareStable || !latestReading || latestReading.weight <= 0 || serialStatus !== 'connected'}
                >
                  {capturedTareStable ? 'Tare Captured' : 'Capture Tare'}
                </Button>
                {capturedTareWeight != null && (
                  <p className="text-lg font-semibold">
                    Captured: {capturedTareWeight} {capturedTareUnit}
                  </p>
                )}
              </div>
            </div>
          )}
          {!needTareCapture && (
            <div className="rounded-md border border-input bg-accent/30 p-3 text-sm text-muted-foreground">
              Tare weight from selected vehicle: {selectedVehicleForTare?.tareWeight} {selectedVehicleForTare?.tareUnit}
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
            <WeightFormFields form={form} vehicles={vehicles} materials={materials} showTareCapture={false} ticketId={ticketId} />
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
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      latestReading.isStable
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    )}>
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
          <AlertDialogCancel className="absolute top-2 right-2"><X /></AlertDialogCancel>
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