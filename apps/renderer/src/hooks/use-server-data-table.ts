import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import type { PaginatedResult } from '@weight/shared/types/index';
import * as React from 'react';

export type FetchPage<TData> = (
  page: number,
  pageSize: number,
  search: string,
  columnFilters: ColumnFiltersState,
) => Promise<PaginatedResult<TData>>;

interface UseServerDataTableProps<TData extends { id: number }> {
  columns: ColumnDef<TData>[];
  fetchPage: FetchPage<TData>;
  initialPageSize?: number;
  onError?: (error: unknown) => void;
}

/**
 * Server-driven table state: pagination, search, and column filters are served
 * from the main process. Sorting and selection apply to the loaded page.
 */
export function useServerDataTable<TData extends { id: number }>({
  columns,
  fetchPage,
  initialPageSize = 10,
  onError,
}: UseServerDataTableProps<TData>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });
  const [search, setSearchState] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const [data, setData] = React.useState<TData[]>([]);
  const [total, setTotal] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const onErrorRef = React.useRef(onError);
  onErrorRef.current = onError;

  const { pageIndex, pageSize } = pagination;

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchPage(pageIndex + 1, pageSize, search, columnFilters);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      onErrorRef.current?.(error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, [fetchPage, pageIndex, pageSize, search, columnFilters]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setSearch = React.useCallback((value: string) => {
    setSearchState(value);
    setRowSelection({});
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const onColumnFiltersChange = React.useCallback((updater: Updater<ColumnFiltersState>) => {
    setColumnFilters((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      return next;
    });
    setRowSelection({});
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const isInitialLoading = isLoading && !hasLoaded;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getRowId: (row) => String(row.id),
    state: { pagination, sorting, columnFilters, rowSelection, columnVisibility },
    enableRowSelection: true,
    manualPagination: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return {
    table,
    isLoading,
    isInitialLoading,
    search,
    setSearch,
    total,
    refetch: load,
  };
}
