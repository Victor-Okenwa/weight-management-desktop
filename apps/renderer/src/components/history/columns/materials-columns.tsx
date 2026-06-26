import type { ColumnDef } from '@tanstack/react-table';
import type { Material } from '@weight/shared/types/index';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/utils';

export const materialsColumns: ColumnDef<Material>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllRowsSelected()}
        onCheckedChange={(e) => table.getToggleAllRowsSelectedHandler()(e)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(e) => row.getToggleSelectedHandler()(e)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => {
      const val = getValue() as string | null;
      return val ? <span className="uppercase">{val}</span> : '--';
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
      const material = row.original;
      return (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => table.options.meta?.editMaterial?.(material)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit material</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => table.options.meta?.deleteMaterial?.(material)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete material</TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
