import type { Control } from 'react-hook-form';
import type { Material, Vehicle } from '@weight/shared/types/index';
import { Separator } from '@/components/ui/separator';
import { FormFields } from '@/components/record-weight-shared/form-fields';
import { WeightCaptureArea } from '@/components/record-weight-shared/weight-capture-area';
import type { NewWeightForm } from '@/components/record-weight-shared/schema';

export function TareWeightStep({
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
