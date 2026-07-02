import type { Material } from '@weight/shared/types/index';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { Checkbox } from '@/components/ui/checkbox';
import { dateRangeFilterFn } from '@/components/history/shared/filter-fns';
import { formatDate } from '@/lib/format';

export const materialsColumns: ColumnDef<Material>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />,
    meta: { label: 'Name' },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} label="Created" />,
    cell: ({ row }) => formatDate(row.original.createdAt),
    enableColumnFilter: true,
    filterFn: dateRangeFilterFn,
    meta: { label: 'Created', variant: 'dateRange' },
  },
];
