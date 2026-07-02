import type { Table } from '@tanstack/react-table';
import { RefreshCw, X } from 'lucide-react';
import type * as React from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableSkeleton } from '@/components/data-table/data-table-skeleton';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { DataTableSearch } from '@/components/history/shared/data-table-search';
import { DataTableSelectionBar } from '@/components/history/shared/data-table-selection-bar';
import { Button } from '@/components/ui/button';

interface HistoryDataTableProps<TData extends { id: number }> {
  table: Table<TData>;
  isLoading: boolean;
  columnCount: number;
  entityName: string;
  searchPlaceholder?: string;
  onSearch: (value: string) => void;
  onDelete: (ids: number[]) => Promise<number>;
  onDeleted?: () => void;
  onRefresh?: () => void;
  /** Filter controls (faceted / date) rendered in the toolbar. */
  children?: React.ReactNode;
}

export function HistoryDataTable<TData extends { id: number }>({
  table,
  isLoading,
  columnCount,
  entityName,
  searchPlaceholder,
  onSearch,
  onDelete,
  onDeleted,
  onRefresh,
  children,
}: HistoryDataTableProps<TData>) {
  'use no memo';
  const isFiltered = table.getState().columnFilters.length > 0;

  if (isLoading) {
    return <DataTableSkeleton columnCount={columnCount} filterCount={2} />;
  }

  return (
    <DataTable
      table={table}
      actionBar={
        <DataTableSelectionBar
          table={table}
          entityName={entityName}
          onDelete={onDelete}
          onDeleted={onDeleted}
        />
      }
    >
      <div
        role="toolbar"
        aria-orientation="horizontal"
        className="flex w-full min-w-0 items-start justify-between gap-2 p-1"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <DataTableSearch onSearch={onSearch} placeholder={searchPlaceholder} />
          {children}
          {isFiltered && (
            <Button
              variant="outline"
              className="h-8 border-dashed"
              onClick={() => table.resetColumnFilters()}
            >
              <X />
              Reset
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              aria-label="Refresh data"
              onClick={onRefresh}
            >
              <RefreshCw />
            </Button>
          )}
          <DataTableViewOptions table={table} />
        </div>
      </div>
    </DataTable>
  );
}
