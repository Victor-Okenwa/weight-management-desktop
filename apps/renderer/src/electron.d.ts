import type { HealthResult } from '@weight/database/repositories/health';
import type { MaterialFilters } from '@weight/database/repositories/materials';
import type {
  CreateRecordInput,
  RecordFilters,
  UpdateRecordInput,
} from '@weight/database/repositories/record';
import type { VehicleFilters } from '@weight/database/repositories/vehicles';
import type { SerialStatus, WeightReading } from '@weight/shared';
import type {
  ActivateLicenseResult,
  AuthStatus,
  LicenseStatus,
  Material,
  PaginatedResult,
  PasswordActionResult,
  PrintersGrouped,
  PrintPreviewInput,
  PrintPreviewResult,
  PrintTicketInput,
  PrintTicketResult,
  Record as RecordType,
  SerialPortInfo,
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

      getMachineId: () => Promise<string>;
      activateLicense: (licenseJson: string) => Promise<ActivateLicenseResult>;
      getLicenseStatus: () => Promise<LicenseStatus>;

      getAuthStatus: () => Promise<AuthStatus>;
      setPasswordless: () => Promise<PasswordActionResult>;
      setPassword: (password: string) => Promise<PasswordActionResult>;
      verifyPassword: (password: string) => Promise<PasswordActionResult>;
      changePassword: (payload: { current: string; next: string }) => Promise<PasswordActionResult>;
      clearPassword: (current: string) => Promise<PasswordActionResult>;
      forgotPasswordReset: () => Promise<PasswordActionResult>;

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
        filters?: MaterialFilters,
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
        filters?: VehicleFilters,
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
      getRecordByTicketId: (ticketId: string) => Promise<RecordType | null>;
      getRecordsPaginated: (
        page: number,
        pageSize: number,
        filters?: RecordFilters,
      ) => Promise<PaginatedResult<RecordType>>;
      deleteRecord: (id: number) => Promise<RecordType | null>;
      deleteRecords: (ids: number[]) => Promise<number>;

      // Printing
      listPrintersGrouped: () => Promise<{ groups: PrintersGrouped }>;
      previewTicket: (input: PrintPreviewInput) => Promise<PrintPreviewResult>;
      printTicket: (input: PrintTicketInput) => Promise<PrintTicketResult>;
    };
  }
}
