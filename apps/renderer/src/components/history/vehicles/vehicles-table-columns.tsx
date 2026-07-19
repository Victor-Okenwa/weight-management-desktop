import type { ColumnDef } from '@tanstack/react-table';
import type { Vehicle } from '@weight/shared/types/index';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTableRowActions } from '@/components/history/shared/data-table-row-actions';
import { dateRangeFilterFn } from '@/components/history/shared/filter-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/format';

export interface VehiclesColumnActions {
  onView: (vehicle: Vehicle) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicle: Vehicle) => void;
}

export function createVehiclesColumns(actions: VehiclesColumnActions): ColumnDef<Vehicle>[] {
  return [
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
      accessorKey: 'tareWeight',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Tare Weight" />,
      cell: ({ row }) =>
        row.original.tareWeight == null ? '--' : row.original.tareWeight.toLocaleString(),
      meta: { label: 'Tare Weight' },
    },
    {
      accessorKey: 'tareUnit',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Unit" />,
      cell: ({ row }) => row.original.tareUnit ?? '--',
      meta: { label: 'Unit' },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} label="Created" />,
      cell: ({ row }) => formatDate(row.original.createdAt),
      enableColumnFilter: true,
      filterFn: dateRangeFilterFn,
      meta: { label: 'Created', variant: 'dateRange' },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          onView={() => actions.onView(row.original)}
          onEdit={() => actions.onEdit(row.original)}
          onDelete={() => actions.onDelete(row.original)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 100,
    },
  ];
}
