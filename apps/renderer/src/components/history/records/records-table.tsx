import type { PaginatedResult, Record as WeightRecord } from '@weight/shared/types/index';
import { toast } from 'sonner';
import { DataTableDateFilter } from '@/components/data-table/data-table-date-filter';
import { DataTableFacetedFilter } from '@/components/data-table/data-table-faceted-filter';
import { recordsColumns } from '@/components/history/records/records-table-columns';
import { HistoryDataTable } from '@/components/history/shared/history-data-table';
import { logger } from '@/lib/logger';
import { useServerDataTable } from '@/hooks/use-server-data-table';

function fetchRecords(
  page: number,
  pageSize: number,
  search: string,
): Promise<PaginatedResult<WeightRecord>> {
  return window.electronAPI.getRecordsPaginated(page, pageSize, search ? { search } : undefined);
}

function deleteRecords(ids: number[]): Promise<number> {
  return window.electronAPI.deleteRecords(ids);
}

export function RecordsTable() {
  'use no memo';
  const { table, isLoading, setSearch, refetch } = useServerDataTable<WeightRecord>({
    columns: recordsColumns,
    fetchPage: fetchRecords,
    onError: (error) => {
      logger('error', `Failed to load records: ${String(error)}`);
      toast.error('Failed to load records');
    },
  });

  const typeColumn = table.getColumn('operationType');
  const statusColumn = table.getColumn('status');
  const createdColumn = table.getColumn('createdAt');

  return (
    <HistoryDataTable
      table={table}
      isLoading={isLoading}
      columnCount={recordsColumns.length}
      entityName="record"
      searchPlaceholder="Search ticket, operator, vehicle..."
      onSearch={setSearch}
      onDelete={deleteRecords}
      onDeleted={refetch}
      onRefresh={refetch}
    >
      {typeColumn && (
        <DataTableFacetedFilter
          column={typeColumn}
          title="Type"
          multiple
          options={[
            { label: 'Single', value: 'single' },
            { label: 'Double', value: 'double' },
          ]}
        />
      )}
      {statusColumn && (
        <DataTableFacetedFilter
          column={statusColumn}
          title="Status"
          multiple
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Completed', value: 'completed' },
          ]}
        />
      )}
      {createdColumn && <DataTableDateFilter column={createdColumn} title="Created" multiple />}
    </HistoryDataTable>
  );
}
