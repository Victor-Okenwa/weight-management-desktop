/* eslint-disable react-refresh/only-export-components */

import { createFileRoute } from '@tanstack/react-router';
import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import type { Material, Record, Vehicle } from '@weight/shared/types/index';
import { AlertTriangle, HistoryIcon, Search, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { materialsColumns } from '@/components/history/columns/materials-columns';
import { recordsColumns } from '@/components/history/columns/records-columns';
import { vehiclesColumns } from '@/components/history/columns/vehicles-columns';
import { MaterialEditDialog } from '@/components/record-weight-shared/history/material-edit-dialog';
import { VehicleEditDialog } from '@/components/record-weight-shared/history/vehicle-edit-dialog';
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
import { useServerPagination } from '@/hooks/use-server-pagination';
import { cn, formatDate } from '@/lib/utils';

export const Route = createFileRoute('/_protected/history')({
  component: RouteComponent,
});

function RouteComponent() {
  const [activeTab, setActiveTab] = useState('records');

  // --- Dialogs state ---
  const [viewRecord, setViewRecord] = useState<Record | null>(null);
  const [deleteRecordItem, setDeleteRecordItem] = useState<Record | null>(null);
  const [deleteRecordIds, setDeleteRecordIds] = useState<number[]>([]);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicleItem, setDeleteVehicleItem] = useState<Vehicle | null>(null);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [deleteMaterialItem, setDeleteMaterialItem] = useState<Material | null>(null);

  // --- Search state ---
  const [recordsSearchInput, setRecordsSearchInput] = useState('');
  const [recordsSearch, setRecordsSearch] = useState('');
  const [vehiclesSearchInput, setVehiclesSearchInput] = useState('');
  const [vehiclesSearch, setVehiclesSearch] = useState('');
  const [materialsSearchInput, setMaterialsSearchInput] = useState('');
  const [materialsSearch, setMaterialsSearch] = useState('');

  // ============ RECORDS ============
  const recordsPagination = useServerPagination({
    fetchFn: useCallback(
      async (page, pageSize) =>
        window.electronAPI.getRecordsPaginated(page, pageSize, {
          search: recordsSearch || undefined,
        }),
      [recordsSearch],
    ),
    defaultPageSize: 10,
  });

  const [recordsPage, setRecordsPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [recordsColumnFilters, setRecordsColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRecordsSet, setSelectedRecordsSet] = useState<Set<number>>(new Set());

  const recordsRowSelection = useMemo(() => {
    const sel: Record<string, boolean> = {};
    selectedRecordsSet.forEach((id) => {
      sel[String(id)] = true;
    });
    return sel;
  }, [selectedRecordsSet]);

  const recordsMeta = useMemo(
    () => ({
      selectedRecordIds: selectedRecordsSet,
      onRecordSelectionChange: (id: number, checked: boolean) => {
        setSelectedRecordsSet((prev) => {
          const next = new Set(prev);
          if (checked) next.add(id);
          else next.delete(id);
          return next;
        });
      },
      onRecordSelectionChangeAll: (ids: number[], checked: boolean) => {
        setSelectedRecordsSet((prev) => {
          const next = new Set(prev);
          if (checked) ids.forEach((id) => next.add(id));
          else ids.forEach((id) => next.delete(id));
          return next;
        });
      },
      viewRecord: (record: Record) => setViewRecord(record),
      editRecord: () => toast.info('Edit record coming soon'),
      deleteRecord: (record: Record) => setDeleteRecordItem(record),
    }),
    [selectedRecordsSet],
  );

  const recordsTable = useReactTable({
    data: recordsPagination.data,
    columns: recordsColumns,
    pageCount: recordsPagination.pageCount,
    state: {
      pagination: recordsPage,
      rowSelection: recordsRowSelection,
      columnFilters: recordsColumnFilters,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(recordsPage) : updater;
      setRecordsPage(next);
      recordsPagination.setPage(next.pageIndex + 1);
      recordsPagination.setPageSize(next.pageSize);
    },
    onRowSelectionChange: () => {},
    onColumnFiltersChange: setRecordsColumnFilters,
    getRowId: (row: Record) => String(row.id),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: recordsMeta,
  });

  // Sync initial page size from hook to table
  if (recordsPage.pageSize !== recordsPagination.pageSize) {
    setRecordsPage((prev) => ({ ...prev, pageSize: recordsPagination.pageSize }));
  }

  // ============ VEHICLES ============
  const vehiclesPagination = useServerPagination({
    fetchFn: useCallback(
      async (page, pageSize) =>
        window.electronAPI.getVehiclesPaginated(page, pageSize, {
          search: vehiclesSearch || undefined,
        }),
      [vehiclesSearch],
    ),
    defaultPageSize: 10,
  });

  const [vehiclesPage, setVehiclesPage] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [vehiclesColumnFilters, setVehiclesColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedVehiclesSet, setSelectedVehiclesSet] = useState<Set<number>>(new Set());

  const vehiclesRowSelection = useMemo(() => {
    const sel: Record<string, boolean> = {};
    selectedVehiclesSet.forEach((id) => {
      sel[String(id)] = true;
    });
    return sel;
  }, [selectedVehiclesSet]);

  const vehiclesMeta = useMemo(
    () => ({
      selectedRecordIds: selectedVehiclesSet,
      onRecordSelectionChange: (id: number, checked: boolean) => {
        setSelectedVehiclesSet((prev) => {
          const next = new Set(prev);
          if (checked) next.add(id);
          else next.delete(id);
          return next;
        });
      },
      onRecordSelectionChangeAll: (ids: number[], checked: boolean) => {
        setSelectedVehiclesSet((prev) => {
          const next = new Set(prev);
          if (checked) ids.forEach((id) => next.add(id));
          else ids.forEach((id) => next.delete(id));
          return next;
        });
      },
      editVehicle: (vehicle: Vehicle) => setEditVehicle(vehicle),
      deleteVehicle: (vehicle: Vehicle) => setDeleteVehicleItem(vehicle),
    }),
    [selectedVehiclesSet],
  );

  const vehiclesTable = useReactTable({
    data: vehiclesPagination.data,
    columns: vehiclesColumns,
    pageCount: vehiclesPagination.pageCount,
    state: {
      pagination: vehiclesPage,
      rowSelection: vehiclesRowSelection,
      columnFilters: vehiclesColumnFilters,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(vehiclesPage) : updater;
      setVehiclesPage(next);
      vehiclesPagination.setPage(next.pageIndex + 1);
      vehiclesPagination.setPageSize(next.pageSize);
    },
    onRowSelectionChange: () => {},
    onColumnFiltersChange: setVehiclesColumnFilters,
    getRowId: (row: Vehicle) => String(row.id),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: vehiclesMeta,
  });

  // ============ MATERIALS ============
  const materialsPagination = useServerPagination({
    fetchFn: useCallback(
      async (page, pageSize) =>
        window.electronAPI.getMaterialsPaginated(page, pageSize, {
          search: materialsSearch || undefined,
        }),
      [materialsSearch],
    ),
    defaultPageSize: 10,
  });

  const [materialsPage, setMaterialsPage] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [materialsColumnFilters, setMaterialsColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedMaterialsSet, setSelectedMaterialsSet] = useState<Set<number>>(new Set());

  const materialsRowSelection = useMemo(() => {
    const sel: Record<string, boolean> = {};
    selectedMaterialsSet.forEach((id) => {
      sel[String(id)] = true;
    });
    return sel;
  }, [selectedMaterialsSet]);

  const materialsMeta = useMemo(
    () => ({
      selectedRecordIds: selectedMaterialsSet,
      onRecordSelectionChange: (id: number, checked: boolean) => {
        setSelectedMaterialsSet((prev) => {
          const next = new Set(prev);
          if (checked) next.add(id);
          else next.delete(id);
          return next;
        });
      },
      onRecordSelectionChangeAll: (ids: number[], checked: boolean) => {
        setSelectedMaterialsSet((prev) => {
          const next = new Set(prev);
          if (checked) ids.forEach((id) => next.add(id));
          else ids.forEach((id) => next.delete(id));
          return next;
        });
      },
      editMaterial: (material: Material) => setEditMaterial(material),
      deleteMaterial: (material: Material) => setDeleteMaterialItem(material),
    }),
    [selectedMaterialsSet],
  );

  const materialsTable = useReactTable({
    data: materialsPagination.data,
    columns: materialsColumns,
    pageCount: materialsPagination.pageCount,
    state: {
      pagination: materialsPage,
      rowSelection: materialsRowSelection,
      columnFilters: materialsColumnFilters,
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(materialsPage) : updater;
      setMaterialsPage(next);
      materialsPagination.setPage(next.pageIndex + 1);
      materialsPagination.setPageSize(next.pageSize);
    },
    onRowSelectionChange: () => {},
    onColumnFiltersChange: setMaterialsColumnFilters,
    getRowId: (row: Material) => String(row.id),
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: materialsMeta,
  });

  // ============ EVENTS ============
  const selectedRecordCount = selectedRecordsSet.size;

  const handleBulkDelete = () => {
    if (selectedRecordCount === 0) return;
    setDeleteRecordIds(Array.from(selectedRecordsSet));
  };

  const confirmBulkDelete = async () => {
    try {
      const count = await window.electronAPI.deleteRecords(deleteRecordIds);
      toast.success(`${count} record(s) deleted`);
      setDeleteRecordIds([]);
      setSelectedRecordsSet(new Set());
      recordsPagination.refetch();
    } catch {
      toast.error('Failed to delete records');
    }
  };

  const confirmDeleteRecord = async () => {
    if (!deleteRecordItem) return;
    try {
      await window.electronAPI.deleteRecord(deleteRecordItem.id);
      toast.success('Record deleted');
      setDeleteRecordItem(null);
      recordsPagination.refetch();
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
      vehiclesPagination.refetch();
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
      materialsPagination.refetch();
    } catch {
      toast.error('Failed to delete material');
    }
  };

  const handleRecordsRefresh = () => {
    setRecordsSearchInput('');
    setRecordsSearch('');
    setSelectedRecordsSet(new Set());
  };

  const handleVehiclesRefresh = () => {
    setVehiclesSearchInput('');
    setVehiclesSearch('');
    setSelectedVehiclesSet(new Set());
  };

  const handleMaterialsRefresh = () => {
    setMaterialsSearchInput('');
    setMaterialsSearch('');
    setSelectedMaterialsSet(new Set());
  };

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
          <TabsList>
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          {/* --- Records --- */}
          <TabsContent value="records">
            <DataTableToolbar table={recordsTable}>
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
              <Button type="button" variant="outline" size="sm" onClick={handleRecordsRefresh}>
                Refresh
              </Button>
            </DataTableToolbar>
            {recordsPagination.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : (
              <DataTable
                table={recordsTable}
                actionBar={
                  selectedRecordCount > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="size-4" />
                      Delete ({selectedRecordCount}) record(s)
                    </Button>
                  )
                }
              />
            )}
          </TabsContent>

          {/* --- Vehicles --- */}
          <TabsContent value="vehicles">
            <DataTableToolbar table={vehiclesTable}>
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
              <Button type="button" variant="outline" size="sm" onClick={handleVehiclesRefresh}>
                Refresh
              </Button>
            </DataTableToolbar>
            {vehiclesPagination.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : (
              <DataTable table={vehiclesTable} />
            )}
          </TabsContent>

          {/* --- Materials --- */}
          <TabsContent value="materials">
            <DataTableToolbar table={materialsTable}>
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
              <Button type="button" variant="outline" size="sm" onClick={handleMaterialsRefresh}>
                Refresh
              </Button>
            </DataTableToolbar>
            {materialsPagination.isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner className="size-8" />
              </div>
            ) : (
              <DataTable table={materialsTable} />
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
                <span className="uppercase">{viewRecord?.vehicleName ?? '--'}</span>
                <span className="text-muted-foreground">Material:</span>
                <span className="uppercase">{viewRecord?.materialName ?? '--'}</span>
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

        {/* --- Delete Record --- */}
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

        {/* --- Bulk Delete --- */}
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

        {/* --- Delete Vehicle --- */}
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

        {/* --- Delete Material --- */}
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
          onSaved={() => vehiclesPagination.refetch()}
        />
        <MaterialEditDialog
          material={editMaterial}
          open={editMaterial != null}
          onOpenChange={(o) => !o && setEditMaterial(null)}
          onSaved={() => materialsPagination.refetch()}
        />
      </div>
    </TooltipProvider>
  );
}
