/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from '@tanstack/react-router';
import { HistoryIcon } from 'lucide-react';
import { MaterialsTable } from '@/components/history/materials/materials-table';
import { RecordsTable } from '@/components/history/records/records-table';
import { VehiclesTable } from '@/components/history/vehicles/vehicles-table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Route = createFileRoute('/_protected/history')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6 min-h-screen overflow-x-hidden">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
            <HistoryIcon className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">History</h2>
            <p className="text-sm text-muted-foreground">
              View and manage records, vehicles, and materials
            </p>
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="records" className="flex flex-col">
          <TabsList>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>
          <TabsContent value="records">
            <RecordsTable />
          </TabsContent>
          <TabsContent value="vehicles">
            <VehiclesTable />
          </TabsContent>
          <TabsContent value="materials">
            <MaterialsTable />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
