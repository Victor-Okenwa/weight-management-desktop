import { useState } from 'react';
import type { Vehicle } from '@weight/shared/types/index';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WeightDisplay } from '@/components/weight-display';
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
  const { latestReading } = useWeightStore();
  const [name, setName] = useState(vehicle?.name ?? '');
  const [tareWeight, setTareWeight] = useState<string>(
    vehicle?.tareWeight != null ? String(vehicle.tareWeight) : '',
  );
  const [tareUnit, setTareUnit] = useState(vehicle?.tareUnit ?? 'kg');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = () => {
    if (latestReading?.weight != null) {
      setTareWeight(String(latestReading.weight));
    }
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
        tareWeight: tareWeight ? Number(tareWeight) : null,
        tareUnit,
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Vehicle</AlertDialogTitle>
          <AlertDialogDescription>Update the vehicle details below.</AlertDialogDescription>
        </AlertDialogHeader>
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
          <Field>
            <FieldLabel htmlFor="edit-vehicle-tare">Tare Weight</FieldLabel>
            <div className="flex items-center gap-2">
              <Input
                id="edit-vehicle-tare"
                type="number"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
                placeholder="Enter tare weight"
                className="flex-1"
              />
              <Select value={tareUnit} onValueChange={setTareUnit}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="ton">ton</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </Field>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Or capture from scale
            </p>
            <div className="flex items-center gap-4">
              <div className="max-w-xs flex-1">
                <WeightDisplay />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCapture}
                disabled={!latestReading?.isStable}
              >
                Capture
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </FieldGroup>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
