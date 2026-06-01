import type {
  CreateRecordInput,
  RecordFilters,
  UpdateRecordInput,
} from '@weight/database/repositories/record';
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
    // Remove any previous listeners to avoid duplicates
    ipcRenderer.removeAllListeners('weight:update');
    ipcRenderer.on('weight:update', (_event, reading) => {
      callback(reading);
    });
  },
  onSerialStatus: (callback: (status: string) => void) => {
    ipcRenderer.removeAllListeners('serial:status');
    ipcRenderer.on('serial:status', (_event, status) => {
      callback(status);
    });
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
  getMaterialsPaginated: (page: number, pageSize: number): Promise<PaginatedResult<Material>> =>
    ipcRenderer.invoke('materials:get-paginated', page, pageSize),

  // Vehicles
  getAllVehicles: (): Promise<Vehicle[]> => ipcRenderer.invoke('vehicles:get-all'),
  getVehiclesPaginated: (page: number, pageSize: number): Promise<PaginatedResult<Vehicle>> =>
    ipcRenderer.invoke('vehicles:get-paginated', page, pageSize),

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
});
