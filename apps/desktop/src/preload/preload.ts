import type {
  CreateRecordInput,
  RecordFilters,
  UpdateRecordInput,
} from '@weight/database/repositories/record';
import type { HealthResult } from '@weight/database/repositories/health';
import type {
  Material,
  PaginatedResult,
  Record as RecordType,
  SerialPortInfo,
  SettingsRow,
  Vehicle,
  WeightReading,
} from '@weight/shared/types/index';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  listSerialPorts: (): Promise<SerialPortInfo[]> => ipcRenderer.invoke('serial:list-ports'),
  reconnectPort: () => ipcRenderer.invoke('serial:reconnect'),

  isSetupCompleted: (): Promise<boolean> => ipcRenderer.invoke('app:is-setup-completed'),
  completeSetup: (settings: Record<string, string>): Promise<boolean> =>
    ipcRenderer.invoke('app:complete-setup', settings),

 onWeightUpdate: (callback: (reading: WeightReading) => void) => {
  const handler = (_event: any, reading: WeightReading) => callback(reading);
  ipcRenderer.on('weight:update', handler);
  return () => ipcRenderer.removeListener('weight:update', handler);
},

onSerialStatus: (callback: (status: string) => void) => {
  const handler = (_event: any, status: string) => callback(status);
  ipcRenderer.on('serial:status', handler);
  return () => ipcRenderer.removeListener('serial:status', handler);
},
  getSerialStatus: (): Promise<string> => ipcRenderer.invoke('serial:get-status'),
  log: (level: string, message: string) => {
    ipcRenderer.send('log', { level, message });
  },
  // Later you can add more methods:
  // getSettings, setSettings, etc.
  getAllSettings: (): Promise<SettingsRow | null> => ipcRenderer.invoke('settings:get-all'),
  updateSettings: (data: Record<string, never>): Promise<boolean> =>
    ipcRenderer.invoke('settings:update', data),

  // Materials
  getAllMaterials: (): Promise<Material[]> => ipcRenderer.invoke('materials:get-all'),
  getMaterialsPaginated: (page: number, pageSize: number, filters?: { search?: string }): Promise<PaginatedResult<Material>> =>
    ipcRenderer.invoke('materials:get-paginated', page, pageSize, filters),
  updateMaterial: (id: number, data: { name?: string }): Promise<Material | null> =>
    ipcRenderer.invoke('materials:update', id, data),
  deleteMaterial: (id: number): Promise<void> => ipcRenderer.invoke('materials:delete', id),

  // Health
  checkDatabaseHealth: (): Promise<HealthResult> => ipcRenderer.invoke('db:health-check'),

  // Vehicles
  getAllVehicles: (): Promise<Vehicle[]> => ipcRenderer.invoke('vehicles:get-all'),
  getVehiclesPaginated: (page: number, pageSize: number, filters?: { search?: string }): Promise<PaginatedResult<Vehicle>> =>
    ipcRenderer.invoke('vehicles:get-paginated', page, pageSize, filters),
  updateVehicle: (id: number, data: { name?: string; tareWeight?: number | null; tareUnit?: string | null }): Promise<Vehicle | null> =>
    ipcRenderer.invoke('vehicles:update', id, data),
  deleteVehicle: (id: number): Promise<void> => ipcRenderer.invoke('vehicles:delete', id),

  // Records
  createRecord: (data: CreateRecordInput): Promise<RecordType> =>
    ipcRenderer.invoke('records:create', data),
  updateRecord: (id: number, data: UpdateRecordInput): Promise<RecordType | null> =>
    ipcRenderer.invoke('records:update', id, data),
  getRecordById: (id: number): Promise<RecordType | null> =>
    ipcRenderer.invoke('records:get-by-id', id),
  getRecordsPaginated: (
    page: number,
    pageSize: number,
    filters?: RecordFilters,
  ): Promise<PaginatedResult<RecordType>> =>
    ipcRenderer.invoke('records:get-paginated', page, pageSize, filters),
  deleteRecord: (id: number): Promise<RecordType | null> => ipcRenderer.invoke('records:delete', id),
  deleteRecords: (ids: number[]): Promise<number> => ipcRenderer.invoke('records:delete-many', ids),
});
