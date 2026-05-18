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
export type StopBits = 1 | 1.5 | 2;
export type FlowControl = 'none' | 'hardware' | 'software';
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
