import type { Table } from '@tanstack/react-table';
import { Trash2, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import { DialogScrollBody } from '@/components/history/shared/dialog-scroll-body';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';

interface DataTableSelectionBarProps<TData extends { id: number }> {
  table: Table<TData>;
  entityName: string;
  onDelete: (ids: number[]) => Promise<number>;
  onDeleted?: () => void;
  deleteDescription?: React.ReactNode;
}

export function DataTableSelectionBar<TData extends { id: number }>({
  table,
  entityName,
  onDelete,
  onDeleted,
  deleteDescription,
}: DataTableSelectionBarProps<TData>) {
  'use no memo';
  const [isDeleting, setIsDeleting] = React.useState(false);
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const count = selectedRows.length;

  const handleDelete = React.useCallback(async () => {
    const ids = selectedRows.map((row) => row.original.id);
    setIsDeleting(true);
    try {
      const deleted = await onDelete(ids);
      toast.success(`Deleted ${deleted} ${entityName}${deleted === 1 ? '' : 's'}`);
      table.resetRowSelection();
      onDeleted?.();
    } catch {
      toast.error(`Failed to delete ${entityName}s`);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedRows, onDelete, entityName, table, onDeleted]);

  return (
    <div className="mx-auto flex w-fit items-center gap-3 rounded-lg border bg-background px-4 py-2 shadow-lg">
      <span className="text-sm font-medium">{count} selected</span>
      <Separator orientation="vertical" className="data-[orientation=vertical]:h-5" />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isDeleting}>
            {isDeleting ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="flex max-h-[90vh] flex-col gap-4">
          <DialogScrollBody maxHeightClassName="max-h-[min(50vh,24rem)]">
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {count} {entityName}
                {count === 1 ? '' : 's'}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteDescription ?? (
                  <>
                    This action cannot be undone. The selected {entityName}
                    {count === 1 ? '' : 's'} will be permanently removed.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </DialogScrollBody>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Clear selection"
        onClick={() => table.resetRowSelection()}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
