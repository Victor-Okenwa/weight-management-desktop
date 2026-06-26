import type { PaginatedResult } from '@weight/shared/types/index';
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseServerPaginationOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<PaginatedResult<T>>;
  defaultPageSize?: number;
}

export function useServerPagination<T>({
  fetchFn,
  defaultPageSize = 10,
}: UseServerPaginationOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const fetchRef = useRef(0);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const doFetch = useCallback(async () => {
    const fetchId = ++fetchRef.current;
    setIsLoading(true);
    try {
      const result = await fetchFn(page, pageSize);
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
  }, [fetchFn, page, pageSize]);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, total, isLoading, page, setPage, pageSize, setPageSize, pageCount, refetch: doFetch };
}
