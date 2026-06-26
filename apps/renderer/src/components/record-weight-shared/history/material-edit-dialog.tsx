import { useState } from 'react';
import type { Material } from '@weight/shared/types/index';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
  const [name, setName] = useState(material?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Material</AlertDialogTitle>
          <AlertDialogDescription>Update the material name below.</AlertDialogDescription>
        </AlertDialogHeader>
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
