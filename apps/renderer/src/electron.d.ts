import type {
  CreateRecordInput,
  HealthResult,
  RecordFilters,
  UpdateRecordInput,
} from '@weight/database/repositories/record';
import type { SerialStatus, WeightReading } from '@weight/shared';
import type {
  Material,
  PaginatedResult,
  Record as RecordType,
  SettingsRow,
  Vehicle,
} from '@weight/shared/types/index';

declare global {
  interface Window {
    electronAPI: {
      listSerialPorts: () => Promise<SerialPortInfo[]>;
      reconnectPort: () => void;

      isSetupCompleted: () => Promise<boolean>;
      completeSetup: (settings: Record<string, string>) => Promise<boolean>;

      onWeightUpdate: (callback: (reading: WeightReading) => void) => () => void;

      onSerialStatus: (callback: (status: string) => void) => () => void;
      getSerialStatus: () => Promise<SerialStatus>;

      log: (level: string, message: string) => void;

      // settings
      getAllSettings: () => Promise<SettingsRow | null>;
      updateSettings: (data: Partial<SettingsRow>) => Promise<boolean>;

      // Materials
      getAllMaterials: () => Promise<Material[]>;
      getMaterialsPaginated: (
        page: number,
        pageSize: number,
        filters?: { search?: string },
      ) => Promise<PaginatedResult<Material>>;
      updateMaterial: (id: number, data: { name?: string }) => Promise<Material | null>;
      deleteMaterial: (id: number) => Promise<void>;
      deleteMaterials: (ids: number[]) => Promise<number>;

      // Health
      checkDatabaseHealth: () => Promise<HealthResult>;

      // Vehicles
      getAllVehicles: () => Promise<Vehicle[]>;
      getVehiclesPaginated: (
        page: number,
        pageSize: number,
        filters?: { search?: string },
      ) => Promise<PaginatedResult<Vehicle>>;
      updateVehicle: (
        id: number,
        data: { name?: string; tareWeight?: number | null; tareUnit?: string | null },
      ) => Promise<Vehicle | null>;
      deleteVehicle: (id: number) => Promise<void>;
      deleteVehicles: (ids: number[]) => Promise<number>;

      // Records
      createRecord: (data: CreateRecordInput) => Promise<RecordType>;
      updateRecord: (id: number, data: UpdateRecordInput) => Promise<RecordType | null>;
      getRecordById: (id: number) => Promise<RecordType | null>;
      getRecordsPaginated: (
        page: number,
        pageSize: number,
        filters?: RecordFilters,
      ) => Promise<PaginatedResult<RecordType>>;
      deleteRecord: (id: number) => Promise<RecordType | null>;
      deleteRecords: (ids: number[]) => Promise<number>;
    };
  }
}
