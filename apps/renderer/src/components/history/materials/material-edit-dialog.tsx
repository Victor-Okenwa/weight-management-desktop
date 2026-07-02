import { useEffect, useState } from 'react';
import type { Material } from '@weight/shared/types/index';
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
import { toast } from 'sonner';

interface MaterialEditDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function MaterialEditDialog({
  material,
  open,
  onOpenChange,
  onSaved,
}: MaterialEditDialogProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && material) {
      setName(material.name);
      setError(null);
    }
  }, [open, material]);

  const handleSave = async () => {
    if (!material) return;
    setError(null);
    if (!name.trim()) {
      setError('Material name is required');
      return;
    }
    setIsSaving(true);
    try {
      const result = await window.electronAPI.updateMaterial(material.id, {
        name: name.trim(),
      });
      if (result === null) {
        setError('A material with this name already exists');
        return;
      }
      toast.success('Material updated');
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error('Failed to update material');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-md flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>Update the material name below.</DialogDescription>
        </DialogHeader>
        <DialogScrollBody>
          <FieldGroup className="space-y-4">
            <Field>
              <FieldLabel htmlFor="edit-material-name">Material Name</FieldLabel>
              <Input
                id="edit-material-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter material name"
              />
            </Field>
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
