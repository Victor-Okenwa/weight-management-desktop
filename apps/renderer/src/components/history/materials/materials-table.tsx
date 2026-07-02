import type { Material, PaginatedResult } from '@weight/shared/types/index';
import { toast } from 'sonner';
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { materialsColumns } from '@/components/history/materials/materials-table-columns';
import { HistoryDataTable } from '@/components/history/shared/history-data-table';
import { useServerDataTable } from '@/hooks/use-server-data-table';
import { logger } from '@/lib/logger';

function fetchMaterials(
  page: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResult<Material>> {
  return window.electronAPI.getMaterialsPaginated(page, pageSize, search ? { search } : undefined);
}

function deleteMaterials(ids: number[]): Promise<number> {
  return window.electronAPI.deleteMaterials(ids);
}

export function MaterialsTable() {
  'use no memo';
  const { table, isLoading, setSearch, refetch } = useServerDataTable<Material>({
    columns: materialsColumns,
    fetchPage: fetchMaterials,
    onError: (error) => {
      logger('error', `Failed to load materials: ${String(error)}`);
      toast.error('Failed to load materials');
    },
  });

  const createdColumn = table.getColumn('createdAt');

  return (
    <HistoryDataTable
      table={table}
      isLoading={isLoading}
      columnCount={materialsColumns.length}
      entityName="material"
      searchPlaceholder="Search materials..."
      onSearch={setSearch}
      onDelete={deleteMaterials}
      onDeleted={refetch}
      onRefresh={refetch}
    >
      {createdColumn && <DataTableDateFilter column={createdColumn} title="Created" multiple />}
    </HistoryDataTable>
  );
}
