import { AsteriskIcon, X } from 'lucide-react';
import { useWeightDialogsStore } from '@/store/weightDialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

export function NewWeightDialog() {
  const { isNewWeightDialogOpen, setNewWeightDialogOpen } = useWeightDialogsStore();
  return (
    <AlertDialog open={isNewWeightDialogOpen} onOpenChange={setNewWeightDialogOpen}>
      <AlertDialogContent className="min-w-[90%] max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogCancel className="absolute top-2 right-2">
            <X />
          </AlertDialogCancel>

          <AlertDialogTitle>Record New Weight</AlertDialogTitle>
          <AlertDialogDescription className="flex! flex-col gap-1">
            <span className="flex items-center">
              Make sure to fill in all required fields marked by
              <AsteriskIcon className="text-red-500" />.
            </span>
            Make sure indicator is connected and displaying correct live weight. it is best to
            Record weight when the traffic light is green (Stable).
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
