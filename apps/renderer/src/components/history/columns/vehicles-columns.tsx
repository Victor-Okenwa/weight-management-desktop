import type { ColumnDef } from '@tanstack/react-table';
import type { Vehicle } from '@weight/shared/types/index';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import { useSelection } from './selection-context';

export const vehiclesColumns: ColumnDef<Vehicle>[] = [
  {
    id: 'select',
    header: ({ table }) => {
      const { selectedIds, onSelectionChangeAll } = useSelection();
      const allIds = table.getRowModel().rows.map((r) => r.original.id);
      const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
      return (
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => {
            onSelectionChangeAll(allIds, !!checked);
          }}
        />
      );
    },
    cell: ({ row }) => {
      const { selectedIds, onSelectionChange } = useSelection();
      const id = row.original.id;
      const isChecked = selectedIds.has(id);
      return (
        <Checkbox
          checked={isChecked}
          onCheckedChange={(checked) => {
            onSelectionChange(id, !!checked);
          }}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Vehicle Name',
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return <span className="uppercase">{val}</span>;
    },
  },
  {
    accessorKey: 'plateNumber',
    header: 'Plate#',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      return val ?? '--';
    },
  },
  {
    accessorKey: 'tareWeight',
    header: 'Tare(kg)',
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val != null ? `${val} kg` : '--';
    },
  },
  {
    accessorKey: 'capacity',
    header: 'Cap(kg)',
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val != null ? `${val} kg` : '--';
    },
  },
  {
    accessorKey: 'axles',
    header: 'Axles',
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val != null ? val : '--';
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    meta: { variant: 'date' as const },
    cell: ({ getValue }) => formatDate(getValue() as string | null),
  },
];
