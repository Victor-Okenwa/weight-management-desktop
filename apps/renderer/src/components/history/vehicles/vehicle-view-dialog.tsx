import type { Vehicle } from '@weight/shared/types/index';
import type { ReactNode } from 'react';
import { DialogScrollBody } from '@/components/history/shared/dialog-scroll-body';
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
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Vehicle Details</DialogTitle>
          <DialogDescription>Full details for {vehicle.name}</DialogDescription>
        </DialogHeader>
        <DialogScrollBody>
          <div className="divide-y">
            <DetailRow label="Name" value={vehicle.name} />
            <DetailRow label="Tare Weight" value={tareDisplay} />
            <DetailRow label="Created" value={formatDate(vehicle.createdAt)} />
          </div>
        </DialogScrollBody>
      </DialogContent>
    </Dialog>
  );
}
