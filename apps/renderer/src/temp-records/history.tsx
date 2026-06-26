/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router';
import type { Material, Record, Vehicle } from '@weight/shared/types/index';
import { AlertTriangle, HistoryIcon, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { MaterialEditDialog } from '@/components/record-weight-shared/history/material-edit-dialog';
import { materialsColumns } from '@/components/record-weight-shared/history/materials-columns';
import { recordsColumns } from '@/components/record-weight-shared/history/records-columns';
import { VehicleEditDialog } from '@/components/record-weight-shared/history/vehicle-edit-dialog';
import { vehiclesColumns } from '@/components/record-weight-shared/history/vehicles-columns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useServerSideTable } from '@/hooks/use-server-side-table';
import { cn, formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_protected/history')({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState('records');

  // --- Records state ---
  const [viewRecord, setViewRecord] = useState<Record | null>(null);
  const [deleteRecordItem, setDeleteRecordItem] = useState<Record | null>(null);
  const [deleteRecordIds, setDeleteRecordIds] = useState<number[]>([]);

  // --- Vehicles state ---
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicleItem, setDeleteVehicleItem] = useState<Vehicle | null>(null);

  // --- Materials state ---
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [deleteMaterialItem, setDeleteMaterialItem] = useState<Material | null>(null);

  // --- Search state (controlled input + committed query) ---
  const [recordsSearchInput, setRecordsSearchInput] = useState('');
  const [recordsSearch, setRecordsSearch] = useState('');
  const [vehiclesSearchInput, setVehiclesSearchInput] = useState('');
  const [vehiclesSearch, setVehiclesSearch] = useState('');
  const [materialsSearchInput, setMaterialsSearchInput] = useState('');
  const [materialsSearch, setMaterialsSearch] = useState('');

  // --- Records table ---
  const recordsTableData = useServerSideTable({
    fetchFn: async ({ page, pageSize, filters }) => {
      return window.electronAPI.getRecordsPaginated(page, pageSize, {
        ...(filters as Record<string, unknown>),
        search: recordsSearch || undefined,
      });
    },
    columns: recordsColumns,
    meta: {
      viewRecord: (record: Record) => setViewRecord(record),
      editRecord: (record: Record) => {
        toast.info('Edit record coming soon');
      },
      deleteRecord: (record: Record) => setDeleteRecordItem(record),
    },
  });

  // --- Vehicles table ---
  const vehiclesTableData = useServerSideTable({
    fetchFn: async ({ page, pageSize, filters }) => {
      return window.electronAPI.getVehiclesPaginated(page, pageSize, {
        ...(filters as Record<string, unknown>),
        search: vehiclesSearch || undefined,
      });
    },
    columns: vehiclesColumns,
    meta: {
      editVehicle: (vehicle: Vehicle) => setEditVehicle(vehicle),
      deleteVehicle: (vehicle: Vehicle) => setDeleteVehicleItem(vehicle),
    },
  });

  // --- Materials table ---
  const materialsTableData = useServerSideTable({
    fetchFn: async ({ page, pageSize, filters }) => {
      return window.electronAPI.getMaterialsPaginated(page, pageSize, {
        ...(filters as Record<string, unknown>),
        search: materialsSearch || undefined,
      });
    },
    columns: materialsColumns,
    meta: {
      editMaterial: (material: Material) => setEditMaterial(material),
      deleteMaterial: (material: Material) => setDeleteMaterialItem(material),
    },
  });

  // --- Refresh handlers (reset search) ---
  const handleRecordsRefresh = () => {
    setRecordsSearchInput('');
    setRecordsSearch('');
    recordsTableData.refetch();
  };

  const handleVehiclesRefresh = () => {
    setVehiclesSearchInput('');
    setVehiclesSearch('');
    vehiclesTableData.refetch();
  };

  const handleMaterialsRefresh = () => {
    setMaterialsSearchInput('');
    setMaterialsSearch('');
    materialsTableData.refetch();
  };

  // --- Bulk delete ---
  const selectedRecordIds = recordsTableData.table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original.id);

  const handleBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    setDeleteRecordIds(selectedRecordIds);
  };

  const confirmBulkDelete = async () => {
    try {
      const count = await window.electronAPI.deleteRecords(deleteRecordIds);
      toast.success(`${count} record(s) deleted`);
      setDeleteRecordIds([]);
      recordsTableData.refetch();
    } catch {
      toast.error('Failed to delete records');
    }
  };

  // --- Single delete ---
  const confirmDeleteRecord = async () => {
    if (!deleteRecordItem) return;
    try {
      await window.electronAPI.deleteRecord(deleteRecordItem.id);
      toast.success('Record deleted');
      setDeleteRecordItem(null);
      recordsTableData.refetch();
    } catch {
      toast.error('Failed to delete record');
    }
  };

  const confirmDeleteVehicle = async () => {
    if (!deleteVehicleItem) return;
    try {
      await window.electronAPI.deleteVehicle(deleteVehicleItem.id);
      toast.success('Vehicle deleted');
      setDeleteVehicleItem(null);
      vehiclesTableData.refetch();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  const confirmDeleteMaterial = async () => {
    if (!deleteMaterialItem) return;
    try {
      await window.electronAPI.deleteMaterial(deleteMaterialItem.id);
      toast.success('Material deleted');
      setDeleteMaterialItem(null);
      materialsTableData.refetch();
    } catch {
      toast.error('Failed to delete material');
    }
  };

  return (
    <TooltipProvider>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6 min-h-screen overflow-hidden">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="pt-4">
            <DataTableToolbar table={recordsTableData.table}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search records..."
                    className="h-8 w-60 pl-8"
                    value={recordsSearchInput}
                    onChange={(e) => setRecordsSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && recordsSearchInput.length >= 2) {
                        setRecordsSearch(recordsSearchInput);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={recordsSearchInput.length < 2}
                  onClick={() => setRecordsSearch(recordsSearchInput)}
                >
                  <Search className="size-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRecordsRefresh}
              >
                Refresh
              </Button>
            </DataTableToolbar>
            {recordsTableData.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : (
              <DataTable
                table={recordsTableData.table}
                actionBar={
                  selectedRecordIds.length > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="size-4" />
                      Delete ({selectedRecordIds.length}) record(s)
                    </Button>
                  )
                }
              />
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="pt-4">
            <DataTableToolbar table={vehiclesTableData.table}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search vehicles..."
                    className="h-8 w-60 pl-8"
                    value={vehiclesSearchInput}
                    onChange={(e) => setVehiclesSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && vehiclesSearchInput.length >= 2) {
                        setVehiclesSearch(vehiclesSearchInput);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={vehiclesSearchInput.length < 2}
                  onClick={() => setVehiclesSearch(vehiclesSearchInput)}
                >
                  <Search className="size-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleVehiclesRefresh}
              >
                Refresh
              </Button>
            </DataTableToolbar>
            {vehiclesTableData.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : (
              <DataTable table={vehiclesTableData.table} />
            )}
          </TabsContent>

          <TabsContent value="materials" className="pt-4">
            <DataTableToolbar table={materialsTableData.table}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    className="h-8 w-60 pl-8"
                    value={materialsSearchInput}
                    onChange={(e) => setMaterialsSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && materialsSearchInput.length >= 2) {
                        setMaterialsSearch(materialsSearchInput);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={materialsSearchInput.length < 2}
                  onClick={() => setMaterialsSearch(materialsSearchInput)}
                >
                  <Search className="size-4" />
                </Button>
              </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleMaterialsRefresh}
              >
                Refresh
              </Button>
            </DataTableToolbar>
            {materialsTableData.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : (
              <DataTable table={materialsTableData.table} />
            )}
          </TabsContent>
        </Tabs>

        {/* --- View Record Detail Dialog --- */}
        <AlertDialog open={viewRecord != null} onOpenChange={(o) => !o && setViewRecord(null)}>
          <AlertDialogContent size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>Record Details</AlertDialogTitle>
              <AlertDialogDescription>Ticket: {viewRecord?.ticketId}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Operator:</span>
                <span>{viewRecord?.operator ?? '--'}</span>
                <span className="text-muted-foreground">Vehicle:</span>
                <span>{viewRecord?.vehicleName ?? '--'}</span>
                <span className="text-muted-foreground">Material:</span>
                <span>{viewRecord?.materialName ?? '--'}</span>
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize">{viewRecord?.operationType ?? '--'}</span>
                <span className="text-muted-foreground">Status:</span>
                <span>
                  {viewRecord && (
                    <Badge
                      className={cn(
                        'text-[10px] leading-none',
                        viewRecord.status === 'completed'
                          ? 'bg-green-500/20 text-green-600 dark:bg-green-500/30 dark:text-green-400'
                          : 'bg-yellow-500/20 text-yellow-600 dark:bg-yellow-500/30 dark:text-yellow-400',
                      )}
                    >
                      {viewRecord.status === 'completed' ? 'Completed' : 'Processing'}
                    </Badge>
                  )}
                </span>
                <span className="text-muted-foreground">Tare:</span>
                <span>{viewRecord?.tareWeight ?? '--'}</span>
                <span className="text-muted-foreground">Gross:</span>
                <span>{viewRecord?.grossWeight ?? '--'}</span>
                <span className="text-muted-foreground">Net:</span>
                <span>{viewRecord?.netWeight ?? '--'}</span>
                <span className="text-muted-foreground">Created:</span>
                <span>{viewRecord ? formatDate(viewRecord.createdAt) : '--'}</span>
                <span className="text-muted-foreground">Updated:</span>
                <span>{viewRecord ? formatDate(viewRecord.updatedAt) : '--'}</span>
              </div>
              {viewRecord?.remark && (
                <div>
                  <span className="text-muted-foreground">Remark:</span>
                  <p className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-2">
                    {viewRecord.remark}
                  </p>
                </div>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setViewRecord(null)}>Close</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- Delete Record Confirmation --- */}
        <AlertDialog
          open={deleteRecordItem != null}
          onOpenChange={(o) => !o && setDeleteRecordItem(null)}
        >
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <AlertTriangle className="size-8 text-destructive" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete Record</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete record <strong>{deleteRecordItem?.ticketId}</strong>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDeleteRecord}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- Bulk Delete Records Confirmation --- */}
        <AlertDialog
          open={deleteRecordIds.length > 0}
          onOpenChange={(o) => !o && setDeleteRecordIds([])}
        >
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <AlertTriangle className="size-8 text-destructive" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete Records</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {deleteRecordIds.length} record(s)? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmBulkDelete}>
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- Delete Vehicle Confirmation --- */}
        <AlertDialog
          open={deleteVehicleItem != null}
          onOpenChange={(o) => !o && setDeleteVehicleItem(null)}
        >
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <AlertTriangle className="size-8 text-destructive" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete Vehicle</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteVehicleItem?.name}</strong>? The
                vehicle reference will be removed from all related weight records, but the records
                themselves will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDeleteVehicle}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- Delete Material Confirmation --- */}
        <AlertDialog
          open={deleteMaterialItem != null}
          onOpenChange={(o) => !o && setDeleteMaterialItem(null)}
        >
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogMedia>
                <AlertTriangle className="size-8 text-destructive" />
              </AlertDialogMedia>
              <AlertDialogTitle>Delete Material</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deleteMaterialItem?.name}</strong>? The
                material reference will be removed from all related weight records, but the records
                themselves will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDeleteMaterial}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* --- Edit Dialogs --- */}
        <VehicleEditDialog
          vehicle={editVehicle}
          open={editVehicle != null}
          onOpenChange={(o) => !o && setEditVehicle(null)}
          onSaved={() => vehiclesTableData.refetch()}
        />
        <MaterialEditDialog
          material={editMaterial}
          open={editMaterial != null}
          onOpenChange={(o) => !o && setEditMaterial(null)}
          onSaved={() => materialsTableData.refetch()}
        />
      </div>
    </TooltipProvider>
  );
}
