import type { ColumnDef } from '@tanstack/react-table';
import type { Record } from '@weight/shared/types/index';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, formatDate } from '@/lib/utils';
import { useSelection } from './selection-context';

export const recordsColumns: ColumnDef<Record>[] = [
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
    accessorKey: 'ticketId',
    header: 'Ticket',
  },
  {
    accessorKey: 'operator',
    header: 'Operator',
  },
  {
    accessorKey: 'vehicleName',
    header: 'Vehicle',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      return val ? <span className="uppercase">{val}</span> : '--';
    },
  },
  {
    accessorKey: 'materialName',
    header: 'Material',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      return val ? <span className="uppercase">{val}</span> : '--';
    },
  },
  {
    accessorKey: 'operationType',
    header: 'Type',
    meta: {
      variant: 'select' as const,
      options: [
        { label: 'Single', value: 'single' },
        { label: 'Double', value: 'double' },
      ],
    },
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return <span className="capitalize">{val}</span>;
    },
  },
  {
    accessorKey: 'tareWeight',
    header: 'Tare',
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val != null ? val : '--';
    },
  },
  {
    accessorKey: 'grossWeight',
    header: 'Gross',
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val != null ? val : '--';
    },
  },
  {
    accessorKey: 'netWeight',
    header: 'Net',
    cell: ({ getValue }) => {
      const val = getValue() as number | null;
      return val != null ? val : '--';
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      variant: 'select' as const,
      options: [
        { label: 'Processing', value: 'pending' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    cell: ({ getValue }) => {
      const status = getValue() as 'pending' | 'completed';
      return (
        <Badge
          className={cn(
            'text-[10px] leading-none',
            status === 'completed'
              ? 'bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400'
              : 'bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400',
          )}
        >
          {status === 'completed' ? 'Completed' : 'Processing'}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'remark',
    header: 'Remark',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      if (!val) return '--';
      return val.length > 15 ? `${val.slice(0, 15)}...` : val;
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    meta: { variant: 'date' as const },
    cell: ({ getValue }) => formatDate(getValue() as string | null),
  },
  {
    id: 'actions',
    header: 'Actions',
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const record = row.original;
      const canEdit = record.status === 'pending';
      return (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => table.options.meta?.viewRecord?.(record)}
              >
                <Eye className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>View details</TooltipContent>
          </Tooltip>
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => table.options.meta?.editRecord?.(record)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit record</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => table.options.meta?.deleteRecord?.(record)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete record</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
