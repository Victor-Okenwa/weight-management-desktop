/* eslint-disable react-refresh/only-export-components */

import { createFileRoute, useRouter } from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const editWeightSearchSchema = z.object({
  ticketId: z.string().min(1),
});

export const Route = createFileRoute('/_protected/edit-weight')({
  validateSearch: editWeightSearchSchema,
  component: EditWeightPage,
});

function EditWeightPage() {
  const router = useRouter();
  const { ticketId } = Route.useSearch();

  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-6 p-6">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.history.back()}>
        <ChevronLeft className="size-4" />
        Back
      </Button>

      <div>
        <h2 className="text-xl font-bold">Edit Weight</h2>
        <p className="text-sm text-muted-foreground">Ticket {ticketId}</p>
      </div>

      <Separator />

      <p className="text-muted-foreground">Edit weight flow coming soon.</p>
    </div>
  );
}
