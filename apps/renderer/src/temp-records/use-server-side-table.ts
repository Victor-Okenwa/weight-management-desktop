import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
} from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { PaginatedResult } from '@weight/shared/types/index';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseServerSideTableOptions<T> {
  fetchFn: (params: {
    page: number;
    pageSize: number;
    filters?: Record<string, unknown>;
  }) => Promise<PaginatedResult<T>>;
  columns: ColumnDef<T>[];
  defaultPageSize?: number;
  meta?: Record<string, unknown>;
}

export function useServerSideTable<T>({
  fetchFn,
  columns,
  defaultPageSize = 10,
  meta,
}: UseServerSideTableOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const fetchRef = useRef(0);

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(total / pagination.pageSize)),
    [total, pagination.pageSize],
  );

  const filtersRecord = useMemo(() => {
    const record: Record<string, unknown> = {};
    for (const filter of columnFilters) {
      record[filter.id] = filter.value;
    }
    return record;
  }, [columnFilters]);

  const doFetch = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setIsLoading(true);
    try {
      const result = await fetchFn({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        filters: filtersRecord,
      });
      if (fetchId === fetchRef.current) {
        setData(result.data as T[]);
        setTotal(result.total);
      }
    } catch {
      if (fetchId === fetchRef.current) {
        setData([]);
        setTotal(0);
      }
    } finally {
      if (fetchId === fetchRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, pagination.pageIndex, pagination.pageSize, filtersRecord]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, columnFilters, rowSelection },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    getRowId: (row: T) => String((row as Record<string, unknown>).id),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta,
  });

  return { table, isLoading, refetch: doFetch };
}
