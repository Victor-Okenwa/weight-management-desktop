import type { Row } from '@tanstack/react-table';

/**
 * Matches when the cell value is one of the selected faceted values.
 * Mirrors the array value emitted by DataTableFacetedFilter.
 */
export function facetedFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
): boolean {
  if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
  const cellValue = row.getValue(columnId);
  return filterValue.map(String).includes(String(cellValue));
}

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Inclusive date-range match. Mirrors the [from, to] epoch-ms tuple emitted by
 * DataTableDateFilter (multiple mode). Non-parseable cell values are excluded
 * whenever a bound is active.
 */
export function dateRangeFilterFn<TData>(
  row: Row<TData>,
  columnId: string,
  filterValue: unknown,
): boolean {
  if (!Array.isArray(filterValue)) return true;
  const [rawFrom, rawTo] = filterValue as (number | undefined)[];
  if (rawFrom == null && rawTo == null) return true;

  const cellValue = row.getValue(columnId);
  const time = new Date(String(cellValue)).getTime();
  if (Number.isNaN(time)) return false;

  if (rawFrom != null && time < startOfDay(rawFrom)) return false;
  if (rawTo != null && time > endOfDay(rawTo)) return false;
  return true;
}
