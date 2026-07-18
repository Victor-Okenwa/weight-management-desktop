export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface WeightReading {
  weight: number;
  unit: string;
  raw: string;
  isStable: boolean;
}

export type SerialStatus =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'idle'
  | 'reconnecting'
  | 'connecting';

export type COMPorts = `COM${number}`;
export type BaudRate =
  | 300
  | 600
  | 1200
  | 2400
  | 4800
  | 9600
  | 14400
  | 19200
  | 38400
  | 57600
  | 115200
  | 230400
  | 460800
  | 921600;
export type Parity = 'none' | 'even' | 'mark' | 'odd' | 'space';
export type StopBits = 1 | 2;
export type FlowControl = 'none' | 'xon/xoff' | 'hardware';
export type DataBits = 5 | 6 | 7 | 8;

export interface SerialOptions {
  port: COMPorts;
  baudRate: BaudRate;
  dataBits: DataBits;
  stopBits: StopBits;
  parity: Parity;
  flowControl: FlowControl;
  autoOpen: boolean;
}

export interface SettingsRow {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLogoPath: string;
  ticketPrefix: string;
  ticketFooter: string;
  nextTicketNumber: number;
  serialPort: string;
  baudRate: BaudRate;
  dataBits: DataBits;
  flowControl: FlowControl;
  parity: Parity;
  stopBits: StopBits;
  autoOpen: boolean;
  indicatorType: string;
  weightUnit: string;
  stableTolerance: number;
  stableDurationMs: number;
  theme: string;
  autoPrint: boolean;
  printerName: string;
  printCopies: number;
}

export interface InstallationRow {
  id: number;
  setupCompleted: boolean;
  machineId: string;
  licenseMachineId: string | null;
  licenseIssuedAt: string | null;
  licenseExpiresAt: string | null;
  licenseSignature: string | null;
  licenseJson: string | null;
  activatedAt: string | null;
}

export interface SerialPortInfo {
  path: string;
  manufacturer: string;
  serialNumber?: string;
  pnpId?: string;
  friendlyName?: string;
}

export interface Vehicle {
  id: number;
  name: string;
  tareWeight: number | null;
  tareUnit: string | null;
  createdAt: string;
}

export interface Material {
  id: number;
  name: string;
  createdAt: string;
}

export interface Record {
  id: number;
  ticketId: string;
  operator: string | null;
  operationType: 'single' | 'double';
  grossWeight: number | null;
  tareWeight: number | null;
  netWeight: number | null;
  status: 'pending' | 'completed';
  vehicleId: number | null;
  materialId: number | null;
  vehicleName: string | null;
  materialName: string | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Offline license payload (matches WMS-licenser LICENSE_FORMAT). */
export interface LicensePayload {
  machineId: string;
  issuedAt: string;
  expiresAt: string;
  signature: string;
}

export type ActivateLicenseResult =
  | { ok: true; expiresAt: string; machineId: string }
  | { ok: false; error: string };

export interface LicenseStatus {
  /** True when a stored license matches this PC and is not expired. */
  activated: boolean;
  machineId: string | null;
  expiresAt: string | null;
  setupCompleted: boolean;
  /** Raw license JSON if one was saved (for resume / display). */
  licenseJson: string | null;
}
