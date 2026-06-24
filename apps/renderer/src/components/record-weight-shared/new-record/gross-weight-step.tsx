import type { Control } from 'react-hook-form';
import type { Material, Vehicle } from '@weight/shared/types/index';
import { Separator } from '@/components/ui/separator';
import { FormFields } from '@/components/record-weight-shared/form-fields';
import type { NewWeightForm } from '@/components/record-weight-shared/schema';
import { WeightCaptureArea } from '@/components/record-weight-shared/weight-capture-area';
import { WeightSummaryCards } from '@/components/record-weight-shared/weight-summary-cards';

export function GrossWeightStep({
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
