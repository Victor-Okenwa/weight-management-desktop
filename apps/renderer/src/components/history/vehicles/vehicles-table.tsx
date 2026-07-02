import type { PaginatedResult, Vehicle } from '@weight/shared/types/index';
import { toast } from 'sonner';
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { vehiclesColumns } from '@/components/history/vehicles/vehicles-table-columns';
import { HistoryDataTable } from '@/components/history/shared/history-data-table';
import { logger } from '@/lib/logger';
import { useServerDataTable } from '@/hooks/use-server-data-table';

function fetchVehicles(
  page: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResult<Vehicle>> {
  return window.electronAPI.getVehiclesPaginated(page, pageSize, search ? { search } : undefined);
}

function deleteVehicles(ids: number[]): Promise<number> {
  return window.electronAPI.deleteVehicles(ids);
}

export function VehiclesTable() {
  'use no memo';
  const { table, isLoading, setSearch, refetch } = useServerDataTable<Vehicle>({
    columns: vehiclesColumns,
    fetchPage: fetchVehicles,
    onError: (error) => {
      logger('error', `Failed to load vehicles: ${String(error)}`);
      toast.error('Failed to load vehicles');
    },
  });

  const createdColumn = table.getColumn('createdAt');

  return (
    <HistoryDataTable
      table={table}
      isLoading={isLoading}
      columnCount={vehiclesColumns.length}
      entityName="vehicle"
      searchPlaceholder="Search vehicles..."
      onSearch={setSearch}
      onDelete={deleteVehicles}
      onDeleted={refetch}
      onRefresh={refetch}
    >
      {createdColumn && <DataTableDateFilter column={createdColumn} title="Created" multiple />}
    </HistoryDataTable>
  );
}
