/* eslint-disable react-refresh/only-export-components */
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import type { Material, Vehicle } from '@weight/shared/types/index';
import { Check, ChevronLeft, ChevronRight, Save, Scale, Weight } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { WeightDisplay } from '@/components/weight-display';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { useWeightStore } from '@/store/weightStore';

export const Route = createFileRoute('/_protected/record-weight')({
  component: RouteComponent,
});

// ======================================================
// SCHEMA
// ======================================================

const newWeightSchema = z.object({
  operationType: z.enum(['single', 'double']),
  tareSource: z.enum(['existing', 'new']).optional(),
  vehicleName: z.string().min(1, 'Vehicle number is required'),
  materialName: z.string().optional(),
  operator: z.string().optional(),
  remark: z.string().optional(),
});

type NewWeightForm = z.infer<typeof newWeightSchema>;

// ======================================================
// STEP DEFINITIONS
// ======================================================

interface StepDef {
  id: string;
  label: string;
  showFor: 'both' | 'double';
}

const allSteps: StepDef[] = [
  { id: 'type', label: 'Weighing Type', showFor: 'both' },
  { id: 'vehicle', label: 'Vehicle', showFor: 'double' },
  { id: 'tare', label: 'Tare Weight', showFor: 'both' },
  { id: 'gross', label: 'Gross Weight', showFor: 'double' },
];

// ======================================================
// VEHICLE COMBOBOX
// ======================================================

function VehicleCombobox({
  vehicles,
  value,
  onChange,
  disabled = false,
  allowNew = true,
}: {
  vehicles: Vehicle[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  allowNew?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const vehicleNames = vehicles.map((v) => v.name);

  if (!allowNew) {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select vehicle..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {vehicles.map((v) => (
              <SelectItem key={v.id} value={v.name}>
                {v.name}
              </SelectItem>
            ))}
            {vehicles.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No vehicles available</div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="relative">
      <Combobox open={open} onOpenChange={setOpen} modal={false}>
        <ComboboxInput
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          placeholder="Type vehicle number..."
          disabled={disabled}
        />
        <ComboboxContent className="w-full p-1 z-50" align="start" sideOffset={4}>
          {vehicleNames.length > 0 || value === '' ? (
            <ComboboxList>
              {value === '' && (
                <Button
                  type="button"
                  key="none"
                  value="none"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                >
                  None
                </Button>
              )}
              {vehicleNames
                .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
                .map((name) => (
                  <ComboboxItem
                    key={name}
                    value={name}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                    }}
                    className="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                  >
                    {name}
                  </ComboboxItem>
                ))}
            </ComboboxList>
          ) : (
            <ComboboxEmpty>
              <div className="px-2 py-1.5 text-sm text-muted-foreground">No vehicles available</div>
            </ComboboxEmpty>
          )}
        </ComboboxContent>
      </Combobox>
      <FieldDescription className="text-xs">
        Input new vehicle name, if you input an already existing vehicle the current tare weight
        will replace the old tare weight.
      </FieldDescription>
    </div>
  );
}

// ======================================================
// MATERIAL COMBOBOX
// ======================================================

function MaterialCombobox({
  materials,
  value,
  onChange,
  disabled = false,
  allowNew = true,
}: {
  materials: Material[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  allowNew?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  if (!allowNew) {
    return (
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select material..." />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="">None</SelectItem>
            {materials.map((m) => (
              <SelectItem key={m.id} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
            {materials.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No materials available
              </div>
            )}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  }

  const materialNames = materials.map((m) => m.name);

  return (
    <div className="relative">
      <Combobox open={open} onOpenChange={setOpen}>
        <ComboboxInput
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type material name..."
          disabled={disabled}
        />
        <ComboboxContent className="w-full p-1" align="start" sideOffset={4}>
          {materialNames.length > 0 || value === '' ? (
            <ComboboxList>
              {value === '' && (
                <ComboboxItem
                  key="none"
                  value=""
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                    setTimeout(() => {
                      inputRef?.current?.focus();
                    }, 0);
                  }}
                  className="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                >
                  None
                </ComboboxItem>
              )}
              {materialNames
                .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
                .map((name) => (
                  <ComboboxItem
                    key={name}
                    value={name}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setTimeout(() => {
                        inputRef?.current?.focus();
                      }, 0);
                    }}
                    className="relative flex w-full cursor-default items-center gap-2 rounded-sm bg-transparent py-1.5 pr-8 pl-2 text-sm text-left hover:bg-accent hover:text-accent-foreground"
                  >
                    {name}
                  </ComboboxItem>
                ))}
            </ComboboxList>
          ) : (
            <ComboboxEmpty>
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No materials available
              </div>
            </ComboboxEmpty>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

// ======================================================
// FORM FIELDS — shared between Tare (step 2) & Gross (step 3)
// ======================================================

function FormFields({
  ticketId,
  control,
  vehicles,
  materials,
  vehicleValue,
  onVehicleChange,
  materialValue,
  onMaterialChange,
  disabled = false,
  vehicleAllowNew = true,
  materialAllowNew = true,
}: {
  ticketId: string;
  control: Control<NewWeightForm>;
  vehicles: Vehicle[];
  materials: Material[];
  vehicleValue: string;
  onVehicleChange: (val: string) => void;
  materialValue: string;
  onMaterialChange: (val: string) => void;
  disabled?: boolean;
  vehicleAllowNew?: boolean;
  materialAllowNew?: boolean;
}) {
  return (
    <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Controller
        name="operator"
        control={control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="weight-operator">Operator</FieldLabel>
            <Input
              {...field}
              id="weight-operator"
              placeholder="Operator name (optional)"
              disabled={disabled}
            />
          </Field>
        )}
      />
      <Field>
        <FieldLabel htmlFor="weight-ticket">Ticket ID</FieldLabel>
        <Input id="weight-ticket" value={ticketId} disabled />
      </Field>
      <Controller
        name="vehicleName"
        control={control}
        render={({ fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>
              Vehicle Number
              <span className="text-destructive">*</span>
            </FieldLabel>
            <VehicleCombobox
              vehicles={vehicles}
              value={vehicleValue}
              onChange={onVehicleChange}
              disabled={disabled}
              allowNew={vehicleAllowNew}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Field>
        <FieldLabel>Material</FieldLabel>
        <MaterialCombobox
          materials={materials}
          value={materialValue}
          onChange={onMaterialChange}
          disabled={disabled}
          allowNew={materialAllowNew}
        />
      </Field>
      <Controller
        name="remark"
        control={control}
        render={({ field }) => (
          <Field className="md:col-span-2">
            <FieldLabel htmlFor="weight-remark">Remark</FieldLabel>
            <Textarea
              {...field}
              id="weight-remark"
              placeholder="Additional notes (optional)"
              className="min-h-20"
              disabled={disabled}
            />
          </Field>
        )}
      />
    </FieldGroup>
  );
}

// ======================================================
// STEP 0 — WEIGHING TYPE
// ======================================================

function WeighingTypeStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: 'single' | 'double') => void;
}) {
  return (
    <div className="space-y-6 py-4">
      <h3 className="text-lg font-semibold">Select Weighing Type</h3>

      <RadioGroup
        value={value}
        onValueChange={onChange}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Label
          className={cn(
            'flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 p-8 transition-all',
            value === 'single' && 'border-primary bg-primary/5',
            value !== 'single' && 'border-border hover:border-muted-foreground/30',
          )}
        >
          <RadioGroupItem value="single" className="sr-only" />
          <Weight className="size-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-base font-semibold">Single Weighing</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Record only the tare weight of the vehicle
            </p>
          </div>
        </Label>

        <Label
          className={cn(
            'flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 p-8 transition-all',
            value === 'double' && 'border-primary bg-primary/5',
            value !== 'double' && 'border-border hover:border-muted-foreground/30',
          )}
        >
          <RadioGroupItem value="double" className="sr-only" />
          <Scale className="size-10 text-muted-foreground" />
          <div className="text-center">
            <p className="text-base font-semibold">Double Weighing</p>
            <p className="mt-1 text-sm text-muted-foreground">Full gross / tare / net workflow</p>
          </div>
        </Label>
      </RadioGroup>
    </div>
  );
}

// ======================================================
// STEP 1 — VEHICLE SELECTION (double only)
// ======================================================

function VehicleSelectionStep({
  tareSource,
  onTareSourceChange,
  vehicles,
  vehicleName,
  onVehicleChange,
}: {
  tareSource: string | undefined;
  onTareSourceChange: (val: 'existing' | 'new') => void;
  vehicles: Vehicle[];
  vehicleName: string;
  onVehicleChange: (val: string) => void;
}) {
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.name === vehicleName) ?? null,
    [vehicles, vehicleName],
  );

  return (
    <div className="space-y-6 py-4">
      <h3 className="text-lg font-semibold">Vehicle &amp; Tare Source</h3>

      <RadioGroup
        value={tareSource}
        onValueChange={onTareSourceChange}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <Label
          className={cn(
            'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-5 transition-all',
            tareSource === 'new' && 'border-primary bg-primary/5',
            tareSource !== 'new' && 'border-border hover:border-muted-foreground/30',
          )}
        >
          <RadioGroupItem value="new" className="sr-only" />
          <div>
            <p className="font-semibold">Record New Weight</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Capture a fresh tare reading</p>
          </div>
        </Label>

        <Label
          className={cn(
            'flex cursor-pointer items-center gap-4 rounded-lg border-2 p-5 transition-all',
            tareSource === 'existing' && 'border-primary bg-primary/5',
            tareSource !== 'existing' && 'border-border hover:border-muted-foreground/30',
          )}
        >
          <RadioGroupItem value="existing" className="sr-only" />
          <div>
            <p className="font-semibold">Use Existing Tare</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Select a vehicle with stored tare
            </p>
          </div>
        </Label>
      </RadioGroup>

      {tareSource === 'existing' && (
        <div className="space-y-3">
          <Label>Select Vehicle</Label>
          <VehicleCombobox
            vehicles={vehicles}
            value={vehicleName}
            onChange={onVehicleChange}
            allowNew={false}
          />
          {selectedVehicle?.tareWeight != null && (
            <p className="text-sm text-muted-foreground">
              Stored tare: <strong>{selectedVehicle.tareWeight}</strong>{' '}
              {selectedVehicle.tareUnit ?? 'kg'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ======================================================
// WEIGHT CAPTURE AREA
// ======================================================

function WeightCaptureArea({
  label,
  capturedWeight,
  onCapture,
  onRecapture,
  canCapture,
  weightUnit,
  existingTare,
}: {
  label: string;
  capturedWeight: number | null;
  onCapture: () => void;
  onRecapture?: () => void;
  canCapture: boolean;
  weightUnit: string;
  existingTare?: { weight: number; unit: string } | null;
}) {
  return (
    <div className="space-y-4">
      {existingTare ? (
        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">
            {existingTare.weight} {existingTare.unit}
          </p>
          <p className="text-xs text-muted-foreground">Using stored vehicle tare</p>
        </div>
      ) : capturedWeight != null ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
              {onRecapture && (
                <Button type="button" variant="outline" size="sm" onClick={onRecapture}>
                  Recapture
                </Button>
              )}
              <Check className="size-5 text-green-500" />
            </div>
          </div>
          <p className="mt-1 text-3xl font-bold">
            {capturedWeight} {weightUnit}
          </p>
          <p className="text-xs text-green-500">Captured</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="max-w-md">
            <WeightDisplay />
          </div>
          <Button
            type="button"
            size="lg"
            onClick={onCapture}
            disabled={!canCapture}
            className="w-full sm:w-auto"
          >
            {canCapture ? `Capture ${label}` : 'Waiting for stable weight...'}
          </Button>
          {!canCapture && (
            <p className="text-xs text-muted-foreground">
              Ensure the scale is connected and the reading is stable
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ======================================================
// STEP 2 — TARE WEIGHT CAPTURE
// ======================================================

function TareWeightStep({
  ticketId,
  control,
  vehicles,
  materials,
  operationType,
  tareSource,
  capturedTareWeight,
  onCaptureTare,
  onRecaptureTare,
  canCapture,
  selectedVehicle,
  weightUnit,
  vehicleValue,
  onVehicleChange,
  materialValue,
  onMaterialChange,
  vehicleAllowNew = true,
}: {
  ticketId: string;
  control: Control<NewWeightForm>;
  vehicles: Vehicle[];
  materials: Material[];
  operationType: string;
  tareSource: string | undefined;
  capturedTareWeight: number | null;
  onCaptureTare: () => void;
  onRecaptureTare: () => void;
  canCapture: boolean;
  selectedVehicle: Vehicle | null;
  weightUnit: string;
  vehicleValue: string;
  onVehicleChange: (val: string) => void;
  materialValue: string;
  onMaterialChange: (val: string) => void;
  vehicleAllowNew?: boolean;
}) {
  const needsCapture =
    operationType === 'single' || (operationType === 'double' && tareSource === 'new');
  const useExisting = operationType === 'double' && tareSource === 'existing';

  return (
    <div className="space-y-8 py-4">
      <h3 className="text-lg font-semibold">Tare Weight Capture</h3>

      <FormFields
        ticketId={ticketId}
        control={control}
        vehicles={vehicles}
        materials={materials}
        vehicleValue={vehicleValue}
        onVehicleChange={onVehicleChange}
        materialValue={materialValue}
        onMaterialChange={onMaterialChange}
        vehicleAllowNew={vehicleAllowNew}
      />

      <Separator />

      {needsCapture && (
        <WeightCaptureArea
          label="Tare Weight"
          capturedWeight={capturedTareWeight}
          onCapture={onCaptureTare}
          onRecapture={onRecaptureTare}
          canCapture={canCapture}
          weightUnit={weightUnit}
        />
      )}

      {useExisting && selectedVehicle && (
        <WeightCaptureArea
          label="Tare Weight (Existing)"
          capturedWeight={null}
          onCapture={onCaptureTare}
          canCapture={false}
          weightUnit={weightUnit}
          existingTare={
            selectedVehicle.tareWeight != null
              ? {
                  weight: selectedVehicle.tareWeight,
                  unit: selectedVehicle.tareUnit ?? weightUnit,
                }
              : null
          }
        />
      )}
    </div>
  );
}

// ======================================================
// WEIGHT SUMMARY CARDS — shown in step 3
// ======================================================

function WeightSummaryCards({
  tareWeight,
  grossWeight,
  netWeight,
  weightUnit,
}: {
  tareWeight: number | null;
  grossWeight: number | null;
  netWeight: number | null;
  weightUnit: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Tare Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {tareWeight != null ? tareWeight : '--'} {weightUnit}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Gross Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {grossWeight != null ? grossWeight : '--'} {weightUnit}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Net Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {netWeight != null ? netWeight : '--'} {weightUnit}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ======================================================
// STEP 3 — GROSS WEIGHT CAPTURE (double only)
// ======================================================

function GrossWeightStep({
  ticketId,
  control,
  vehicles,
  materials,
  capturedTareWeight,
  capturedGrossWeight,
  onCaptureGross,
  onRecaptureGross,
  canCapture,
  selectedVehicle,
  weightUnit,
  netWeight,
  vehicleValue,
  onVehicleChange,
  materialValue,
  onMaterialChange,
  vehicleAllowNew = true,
}: {
  ticketId: string;
  control: Control<NewWeightForm>;
  vehicles: Vehicle[];
  materials: Material[];
  capturedTareWeight: number | null;
  capturedGrossWeight: number | null;
  onCaptureGross: () => void;
  onRecaptureGross: () => void;
  canCapture: boolean;
  selectedVehicle: Vehicle | null;
  weightUnit: string;
  netWeight: number | null;
  vehicleValue: string;
  onVehicleChange: (val: string) => void;
  materialValue: string;
  onMaterialChange: (val: string) => void;
  vehicleAllowNew?: boolean;
}) {
  const tareValue = capturedTareWeight ?? selectedVehicle?.tareWeight ?? null;

  return (
    <div className="space-y-8 py-4">
      <h3 className="text-lg font-semibold">Gross Weight Capture</h3>

      <WeightSummaryCards
        tareWeight={tareValue}
        grossWeight={capturedGrossWeight}
        netWeight={netWeight}
        weightUnit={weightUnit}
      />

      <Separator />

      <FormFields
        ticketId={ticketId}
        control={control}
        vehicles={vehicles}
        materials={materials}
        vehicleValue={vehicleValue}
        onVehicleChange={onVehicleChange}
        materialValue={materialValue}
        onMaterialChange={onMaterialChange}
        vehicleAllowNew={vehicleAllowNew}
      />

      <Separator />

      <WeightCaptureArea
        label="Gross Weight"
        capturedWeight={capturedGrossWeight}
        onCapture={onCaptureGross}
        onRecapture={onRecaptureGross}
        canCapture={canCapture}
        weightUnit={weightUnit}
      />
    </div>
  );
}

// ======================================================
// MAIN COMPONENT
// ======================================================

function RouteComponent() {
  const navigate = useNavigate();
  const { settings } = useSettingsStore();
  const { latestReading } = useWeightStore();

  const [stepIndex, setStepIndex] = useState(0);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [capturedTareWeight, setCapturedTareWeight] = useState<number | null>(null);
  const [capturedGrossWeight, setCapturedGrossWeight] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const form = useForm<NewWeightForm>({
    resolver: zodResolver(newWeightSchema),
    defaultValues: {
      operationType: 'double',
      vehicleName: '',
      materialName: '',
      operator: '',
      remark: '',
    },
  });

  const operationType = form.watch('operationType');
  const vehicleName = form.watch('vehicleName');
  const materialName = form.watch('materialName');
  const tareSource = form.watch('tareSource');

  const vehicleAllowNew = !(operationType === 'double' && tareSource === 'existing');

  const visibleSteps = useMemo(
    () => allSteps.filter((s) => operationType === 'double' || s.showFor === 'both'),
    [operationType],
  );

  useEffect(() => {
    if (stepIndex >= visibleSteps.length) {
      setStepIndex(Math.max(0, visibleSteps.length - 1));
    }
  }, [visibleSteps.length, stepIndex]);

  const currentStep = visibleSteps[stepIndex];
  const weightUnit = settings?.weightUnit ?? 'kg';

  const ticketId = settings
    ? `${settings.ticketPrefix}-${String(settings.nextTicketNumber).padStart(4, '0')}`
    : '---';

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.name === vehicleName) ?? null,
    [vehicles, vehicleName],
  );

  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [vehiclesData, materialsData] = await Promise.all([
          window.electronAPI.getAllVehicles(),
          window.electronAPI.getAllMaterials(),
        ]);
        setVehicles(vehiclesData);
        setMaterials(materialsData);
      } catch {
        toast.error('Failed to load vehicles and materials');
      } finally {
        setIsLoadingData(false);
      }
    }

    form.reset();
    setStepIndex(0);
    setCapturedTareWeight(null);
    setCapturedGrossWeight(null);
    loadData();
  }, [form]);

  const canCapture = latestReading?.isStable === true && latestReading?.weight != null;

  const handleCaptureTare = useCallback(() => {
    if (canCapture && latestReading) {
      setCapturedTareWeight(latestReading.weight);
    }
  }, [canCapture, latestReading]);

  const handleCaptureGross = useCallback(() => {
    if (canCapture && latestReading) {
      setCapturedGrossWeight(latestReading.weight);
    }
  }, [canCapture, latestReading]);

  const handleRecaptureTare = useCallback(() => setCapturedTareWeight(null), []);
  const handleRecaptureGross = useCallback(() => setCapturedGrossWeight(null), []);

  const netWeight = useMemo(() => {
    if (capturedGrossWeight == null) return null;
    const tare = capturedTareWeight ?? selectedVehicle?.tareWeight ?? 0;
    return capturedGrossWeight - tare;
  }, [capturedGrossWeight, capturedTareWeight, selectedVehicle]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    switch (currentStep?.id) {
      case 'type': {
        if (!operationType) {
          toast.error('Please select a weighing type');
          return false;
        }
        return true;
      }
      case 'vehicle': {
        const tareValue = form.getValues('tareSource');
        if (tareValue === 'existing' && !form.getValues('vehicleName')) {
          toast.error('Please select a vehicle with existing tare');
          return false;
        }
        return true;
      }
      case 'tare': {
        const valid = await form.trigger('vehicleName');
        if (!valid) return false;
        const needsCapture =
          operationType === 'single' ||
          (operationType === 'double' && form.getValues('tareSource') === 'new');
        if (needsCapture && !capturedTareWeight) {
          toast.error('Please capture the tare weight before continuing');
          return false;
        }
        return true;
      }
      case 'gross': {
        const valid = await form.trigger('vehicleName');
        if (!valid) return false;
        if (!capturedGrossWeight) {
          toast.error('Please capture the gross weight');
          return false;
        }
        return true;
      }
      default:
        return true;
    }
  }, [currentStep, operationType, capturedTareWeight, capturedGrossWeight, form]);

  const handleNext = async () => {
    if (!(await validateCurrentStep())) return;
    if (stepIndex < visibleSteps.length - 1) {
      setStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  const buildSubmitPayload = useCallback(
    (status: 'pending' | 'completed') => {
      const values = form.getValues();
      const payload: Record<string, unknown> = {
        operationType: values.operationType,
        vehicleName: values.vehicleName || undefined,
        materialName: values.materialName || undefined,
        operator: values.operator || undefined,
        remark: values.remark || undefined,
        status,
      };

      if (values.operationType === 'single' || values.operationType === 'double') {
        if (capturedTareWeight != null) {
          payload.tareWeight = capturedTareWeight;
          payload.vehicleTareWeight = capturedTareWeight;
          payload.vehicleTareUnit = weightUnit;
        } else if (selectedVehicle?.tareWeight != null) {
          payload.vehicleTareWeight = selectedVehicle.tareWeight;
          payload.vehicleTareUnit = selectedVehicle.tareUnit ?? weightUnit;
        }
      }

      if (values.operationType === 'double') {
        if (capturedGrossWeight != null) {
          payload.grossWeight = capturedGrossWeight;
        }
        if (netWeight != null) {
          payload.netWeight = netWeight;
        }
      }

      return payload;
    },
    [capturedTareWeight, capturedGrossWeight, selectedVehicle, weightUnit, netWeight, form],
  );

  const handleSaveExit = useCallback(async () => {
    const vehicle = form.getValues('vehicleName');
    if (!vehicle) {
      toast.error('Vehicle number is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildSubmitPayload('pending');
      await window.electronAPI.createRecord(payload);
      toast.success('Record saved');
      navigate({ to: '/' });
    } catch {
      toast.error('Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, buildSubmitPayload, navigate]);

  const handleComplete = useCallback(async () => {
    if (!(await validateCurrentStep())) return;

    setIsSubmitting(true);
    try {
      const payload = buildSubmitPayload('completed');
      await window.electronAPI.createRecord(payload);
      toast.success('Record saved');
      navigate({ to: '/' });
    } catch {
      toast.error('Failed to save record');
    } finally {
      setIsSubmitting(false);
    }
  }, [validateCurrentStep, buildSubmitPayload, navigate]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <Scale className="size-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">New Weight Record</h2>
          <p className="text-sm text-muted-foreground">Ticket: {ticketId}</p>
        </div>
      </div>

      <Separator />

      {visibleSteps.length > 1 && (
        <div className="flex items-center gap-0 px-2">
          {visibleSteps.map((step, index) => {
            const isCompleted = index < stepIndex;
            const isActive = index === stepIndex;

            return (
              <div key={step.id} className="flex flex-1 items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (index <= stepIndex) setStepIndex(index);
                  }}
                  disabled={index > stepIndex}
                  className="group flex flex-col items-center text-center"
                >
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                      isCompleted && 'border-green-500 bg-green-500 text-white',
                      isActive && 'border-primary bg-primary text-white',
                      !isCompleted &&
                        !isActive &&
                        'border-muted-foreground/30 text-muted-foreground',
                    )}
                  >
                    {isCompleted ? <Check className="size-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      'mt-1.5 text-xs font-medium',
                      isActive && 'text-primary',
                      !isActive && 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {index < visibleSteps.length - 1 && (
                  <div
                    className={cn(
                      'mx-2 h-px flex-1',
                      index < stepIndex && 'bg-primary',
                      index >= stepIndex && 'bg-border',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <Separator />

      {isLoadingData ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="size-8" />
        </div>
      ) : (
        <div
          key={currentStep?.id ?? 'empty'}
          className="animate-in fade-in slide-in-from-right-4 duration-200"
        >
          {currentStep?.id === 'type' && (
            <WeighingTypeStep
              value={operationType}
              onChange={(val) => form.setValue('operationType', val)}
            />
          )}

          {currentStep?.id === 'vehicle' && (
            <VehicleSelectionStep
              tareSource={form.watch('tareSource')}
              onTareSourceChange={(val) => form.setValue('tareSource', val)}
              vehicles={vehicles}
              vehicleName={vehicleName}
              onVehicleChange={(val) => form.setValue('vehicleName', val)}
            />
          )}

          {currentStep?.id === 'tare' && (
            <TareWeightStep
              ticketId={ticketId}
              control={form.control}
              vehicles={vehicles}
              materials={materials}
              operationType={operationType}
              tareSource={form.watch('tareSource')}
              capturedTareWeight={capturedTareWeight}
              onCaptureTare={handleCaptureTare}
              onRecaptureTare={handleRecaptureTare}
              canCapture={canCapture}
              selectedVehicle={selectedVehicle}
              weightUnit={weightUnit}
              vehicleValue={vehicleName}
              onVehicleChange={(val) => form.setValue('vehicleName', val)}
              materialValue={String(materialName)}
              onMaterialChange={(val) => form.setValue('materialName', val)}
              vehicleAllowNew={vehicleAllowNew}
            />
          )}

          {currentStep?.id === 'gross' && (
            <GrossWeightStep
              ticketId={ticketId}
              control={form.control}
              vehicles={vehicles}
              materials={materials}
              capturedTareWeight={capturedTareWeight}
              capturedGrossWeight={capturedGrossWeight}
              onCaptureGross={handleCaptureGross}
              onRecaptureGross={handleRecaptureGross}
              canCapture={canCapture}
              selectedVehicle={selectedVehicle}
              weightUnit={weightUnit}
              netWeight={netWeight}
              vehicleValue={vehicleName}
              onVehicleChange={(val) => form.setValue('vehicleName', val)}
              materialValue={String(materialName)}
              onMaterialChange={(val) => form.setValue('materialName', val)}
              vehicleAllowNew={vehicleAllowNew}
            />
          )}

          {(!currentStep || currentStep.id === '') && (
            <div className="py-8 text-center text-muted-foreground">No step content available</div>
          )}
        </div>
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Step {stepIndex + 1} of {visibleSteps.length}
        </div>

        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={handlePrev} disabled={isSubmitting}>
              <ChevronLeft className="size-4" />
              Previous
            </Button>
          )}

          {(currentStep?.id === 'tare' || currentStep?.id === 'gross') && (
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveExit}
              disabled={isSubmitting}
            >
              <Save className="size-4" />
              Save & Exit
            </Button>
          )}

          {stepIndex < visibleSteps.length - 1 ? (
            <Button type="button" onClick={handleNext} disabled={isSubmitting}>
              Continue
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleComplete} disabled={isSubmitting}>
              {isSubmitting && <Spinner className="size-4" />}
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
