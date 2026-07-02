import type { PaginatedResult } from '@weight/shared/types/index';
import {
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import * as React from 'react';

type FetchPage<TData> = (
  page: number,
  pageSize: number,
  search: string,
) => Promise<PaginatedResult<TData>>;

interface UseServerDataTableProps<TData extends { id: number }> {
  columns: ColumnDef<TData>[];
  fetchPage: FetchPage<TData>;
  initialPageSize?: number;
  onError?: (error: unknown) => void;
}

/**
 * Hybrid table state: pagination and search are served from the main process,
 * while filtering, sorting, column visibility and selection are handled on the
 * client against the currently loaded page.
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

  const onErrorRef = React.useRef(onError);
  onErrorRef.current = onError;

  const { pageIndex, pageSize } = pagination;

  const load = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchPage(pageIndex + 1, pageSize, search);
      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      onErrorRef.current?.(error);
      setData([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, pageIndex, pageSize, search]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setSearch = React.useCallback((value: string) => {
    setSearchState(value);
    setRowSelection({});
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getRowId: (row) => String(row.id),
    state: { pagination, sorting, columnFilters, rowSelection, columnVisibility },
    enableRowSelection: true,
    manualPagination: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

  return { table, isLoading, search, setSearch, total, refetch: load };
}
