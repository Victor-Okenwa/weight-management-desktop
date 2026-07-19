import type { ColumnFiltersState } from '@tanstack/react-table';
import type { Material, PaginatedResult } from '@weight/shared/types/index';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { MaterialEditDialog } from '@/components/history/materials/material-edit-dialog';
import { MaterialViewDialog } from '@/components/history/materials/material-view-dialog';
import { createMaterialsColumns } from '@/components/history/materials/materials-table-columns';
import { DeleteConfirmDialog } from '@/components/history/shared/delete-confirm-dialog';
import { HistoryDataTable } from '@/components/history/shared/history-data-table';
import { getDateRangeFilter } from '@/components/history/shared/server-filter-utils';
import { useServerDataTable } from '@/hooks/use-server-data-table';
import { logger } from '@/lib/logger';

const CASCADE_WARNING =
  'Deleting this material will also permanently delete all weight records linked to it. This action cannot be undone.';

function fetchMaterials(
  page: number,
  pageSize: number,
  search: string,
  columnFilters: ColumnFiltersState,
): Promise<PaginatedResult<Material>> {
  const { startDate, endDate } = getDateRangeFilter(columnFilters, 'createdAt');

  return window.electronAPI.getMaterialsPaginated(page, pageSize, {
    ...(search ? { search } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });
}

function deleteMaterials(ids: number[]): Promise<number> {
  return window.electronAPI.deleteMaterials(ids);
}

export function MaterialsTable() {
  'use no memo';
  const [viewItem, setViewItem] = useState<Material | null>(null);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [deleteItem, setDeleteItem] = useState<Material | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo(
    () =>
      createMaterialsColumns({
        onView: setViewItem,
        onEdit: setEditItem,
        onDelete: setDeleteItem,
      }),
    [],
  );

  const { table, isLoading, isInitialLoading, setSearch, refetch } = useServerDataTable<Material>({
    columns,
    fetchPage: fetchMaterials,
    onError: (error) => {
      logger('error', `Failed to load materials: ${String(error)}`);
      toast.error('Failed to load materials');
    },
  });

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await window.electronAPI.deleteMaterial(deleteItem.id);
      toast.success('Material deleted');
      setDeleteItem(null);
      void refetch();
    } catch {
      toast.error('Failed to delete material');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteItem, refetch]);

  const createdColumn = table.getColumn('createdAt');

  return (
    <>
      <HistoryDataTable
        table={table}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        columnCount={columns.length}
        entityName="material"
        searchPlaceholder="Search materials..."
        onSearch={setSearch}
        onDelete={deleteMaterials}
        onDeleted={refetch}
        onRefresh={refetch}
        deleteDescription={CASCADE_WARNING}
      >
        {createdColumn && <DataTableDateFilter column={createdColumn} title="Created" multiple />}
      </HistoryDataTable>

      <MaterialViewDialog
        material={viewItem}
        open={viewItem != null}
        onOpenChange={(open) => !open && setViewItem(null)}
      />

      <MaterialEditDialog
        material={editItem}
        open={editItem != null}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSaved={refetch}
      />

      <DeleteConfirmDialog
        open={deleteItem != null}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title={`Delete ${deleteItem?.name ?? 'material'}?`}
        description="This material will be permanently removed."
        warning={CASCADE_WARNING}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
