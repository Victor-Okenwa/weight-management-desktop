import type { Vehicle } from '@weight/shared/types/index';
import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-2 text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

interface VehicleViewDialogProps {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleViewDialog({ vehicle, open, onOpenChange }: VehicleViewDialogProps) {
  if (!vehicle) return null;

  const tareDisplay =
    vehicle.tareWeight != null
      ? `${vehicle.tareWeight.toLocaleString()} ${vehicle.tareUnit ?? ''}`
      : '--';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vehicle Details</DialogTitle>
          <DialogDescription>Full details for {vehicle.name}</DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          <DetailRow label="Name" value={vehicle.name} />
          <DetailRow label="Tare Weight" value={tareDisplay} />
          <DetailRow label="Created" value={formatDate(vehicle.createdAt)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
