import type { ColumnFiltersState } from '@tanstack/react-table';
import type { PaginatedResult, Vehicle } from '@weight/shared/types/index';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { DeleteConfirmDialog } from '@/components/history/shared/delete-confirm-dialog';
import { HistoryDataTable } from '@/components/history/shared/history-data-table';
import { getDateRangeFilter } from '@/components/history/shared/server-filter-utils';
import { VehicleEditDialog } from '@/components/history/vehicles/vehicle-edit-dialog';
import { VehicleViewDialog } from '@/components/history/vehicles/vehicle-view-dialog';
import { createVehiclesColumns } from '@/components/history/vehicles/vehicles-table-columns';
import { useServerDataTable } from '@/hooks/use-server-data-table';
import { logger } from '@/lib/logger';

const CASCADE_WARNING =
  'Deleting this vehicle will also permanently delete all weight records linked to it. This action cannot be undone.';

function fetchVehicles(
  page: number,
  pageSize: number,
  search: string,
  columnFilters: ColumnFiltersState,
): Promise<PaginatedResult<Vehicle>> {
  const { startDate, endDate } = getDateRangeFilter(columnFilters, 'createdAt');

  return window.electronAPI.getVehiclesPaginated(page, pageSize, {
    ...(search ? { search } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  });
}

function deleteVehicles(ids: number[]): Promise<number> {
  return window.electronAPI.deleteVehicles(ids);
}

export function VehiclesTable() {
  'use no memo';
  const [viewItem, setViewItem] = useState<Vehicle | null>(null);
  const [editItem, setEditItem] = useState<Vehicle | null>(null);
  const [deleteItem, setDeleteItem] = useState<Vehicle | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const columns = useMemo(
    () =>
      createVehiclesColumns({
        onView: setViewItem,
        onEdit: setEditItem,
        onDelete: setDeleteItem,
      }),
    [],
  );

  const { table, isLoading, isInitialLoading, setSearch, refetch } = useServerDataTable<Vehicle>({
    columns,
    fetchPage: fetchVehicles,
    onError: (error) => {
      logger('error', `Failed to load vehicles: ${String(error)}`);
      toast.error('Failed to load vehicles');
    },
  });

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteItem) return;
    setIsDeleting(true);
    try {
      await window.electronAPI.deleteVehicle(deleteItem.id);
      toast.success('Vehicle deleted');
      setDeleteItem(null);
      void refetch();
    } catch {
      toast.error('Failed to delete vehicle');
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
        entityName="vehicle"
        searchPlaceholder="Search vehicles..."
        onSearch={setSearch}
        onDelete={deleteVehicles}
        onDeleted={refetch}
        onRefresh={refetch}
        deleteDescription={CASCADE_WARNING}
      >
        {createdColumn && <DataTableDateFilter column={createdColumn} title="Created" multiple />}
      </HistoryDataTable>

      <VehicleViewDialog
        vehicle={viewItem}
        open={viewItem != null}
        onOpenChange={(open) => !open && setViewItem(null)}
      />

      <VehicleEditDialog
        vehicle={editItem}
        open={editItem != null}
        onOpenChange={(open) => !open && setEditItem(null)}
        onSaved={refetch}
      />

      <DeleteConfirmDialog
        open={deleteItem != null}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title={`Delete ${deleteItem?.name ?? 'vehicle'}?`}
        description="This vehicle will be permanently removed."
        warning={CASCADE_WARNING}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
