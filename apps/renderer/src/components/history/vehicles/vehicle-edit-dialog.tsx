import { useEffect, useState } from 'react';
import type { Vehicle } from '@weight/shared/types/index';
import { WeightCaptureArea } from '@/components/record-weight-shared/weight-capture-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { DialogScrollBody } from '@/components/history/shared/dialog-scroll-body';
import { useSettingsStore } from '@/store/settingsStore';
import { useWeightStore } from '@/store/weightStore';
import { toast } from 'sonner';

interface VehicleEditDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function VehicleEditDialog({
  vehicle,
  open,
  onOpenChange,
  onSaved,
}: VehicleEditDialogProps) {
  const { settings } = useSettingsStore();
  const { latestReading } = useWeightStore();
  const weightUnit = settings?.weightUnit ?? 'kg';

  const [name, setName] = useState('');
  const [capturedTareWeight, setCapturedTareWeight] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCapture = latestReading?.isStable === true;

  useEffect(() => {
    if (open && vehicle) {
      setName(vehicle.name);
      setCapturedTareWeight(vehicle.tareWeight);
      setError(null);
    }
  }, [open, vehicle]);

  const handleCaptureTare = () => {
    if (latestReading?.weight != null) {
      setCapturedTareWeight(latestReading.weight);
    }
  };

  const handleRecaptureTare = () => {
    setCapturedTareWeight(null);
  };

  const handleSave = async () => {
    if (!vehicle) return;
    setError(null);
    if (!name.trim()) {
      setError('Vehicle name is required');
      return;
    }
    setIsSaving(true);
    try {
      const result = await window.electronAPI.updateVehicle(vehicle.id, {
        name: name.trim(),
        tareWeight: capturedTareWeight,
        tareUnit: weightUnit,
      });
      if (result === null) {
        setError('A vehicle with this name already exists');
        return;
      }
      toast.success('Vehicle updated');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to update vehicle');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
          <DialogDescription>Update the vehicle name and re-record tare weight.</DialogDescription>
        </DialogHeader>
        <DialogScrollBody>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="edit-vehicle-name">Vehicle Name</FieldLabel>
              <Input
                id="edit-vehicle-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter vehicle name"
              />
            </Field>
            <WeightCaptureArea
              label="Tare Weight"
              capturedWeight={capturedTareWeight}
              onCapture={handleCaptureTare}
              onRecapture={handleRecaptureTare}
              canCapture={canCapture}
              weightUnit={weightUnit}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </FieldGroup>
        </DialogScrollBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
