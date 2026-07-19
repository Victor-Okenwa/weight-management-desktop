import type { ColumnFiltersState } from '@tanstack/react-table';

function startOfDayIso(timestamp: number): string {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function endOfDayIso(timestamp: number): string {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

function getFilterValue(columnFilters: ColumnFiltersState, id: string): unknown {
  return columnFilters.find((filter) => filter.id === id)?.value;
}

export function getStringListFilter(
  columnFilters: ColumnFiltersState,
  id: string,
): string[] | undefined {
  const value = getFilterValue(columnFilters, id);
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.map(String);
}

export function getDateRangeFilter(
  columnFilters: ColumnFiltersState,
  id: string,
): {
  startDate?: string;
  endDate?: string;
} {
  const value = getFilterValue(columnFilters, id);
  if (!Array.isArray(value)) return {};

  const [rawFrom, rawTo] = value as (number | undefined)[];
  return {
    startDate: rawFrom != null ? startOfDayIso(rawFrom) : undefined,
    endDate: rawTo != null ? endOfDayIso(rawTo) : undefined,
  };
}
