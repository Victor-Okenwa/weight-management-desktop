import { Eye, Pencil, Printer, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface DataTableRowActionsProps {
  onView: () => void;
  onEdit?: () => void;
  onPrint?: () => void;
  onDelete: () => void;
  showEdit?: boolean;
  showPrint?: boolean;
}

export function DataTableRowActions({
  onView,
  onEdit,
  onPrint,
  onDelete,
  showEdit = true,
  showPrint = false,
}: DataTableRowActionsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onView}>
            <Eye className="size-4" />
            <span className="sr-only">View</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>View</TooltipContent>
      </Tooltip>
      {showEdit && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onEdit}>
              <Pencil className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
      )}
      {showPrint && onPrint && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onPrint}>
              <Printer className="size-4" />
              <span className="sr-only">Print</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}
