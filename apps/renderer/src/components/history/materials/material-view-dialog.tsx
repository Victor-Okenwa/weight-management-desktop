import type { Material } from '@weight/shared/types/index';
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

interface MaterialViewDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialViewDialog({ material, open, onOpenChange }: MaterialViewDialogProps) {
  if (!material) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Material Details</DialogTitle>
          <DialogDescription>Full details for {material.name}</DialogDescription>
        </DialogHeader>
        <div className="divide-y">
          <DetailRow label="Name" value={material.name} />
          <DetailRow label="Created" value={formatDate(material.createdAt)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
