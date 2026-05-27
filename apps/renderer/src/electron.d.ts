import type { SerialStatus, WeightReading } from '@weight/shared';
import type { SettingsRow } from '@weight/shared/types/index';

declare global {
  interface Window {
    electronAPI: {
      listSerialPorts: () => Promise<SerialPortInfo[]>;
      reconnectPort: () => void;

      isSetupCompleted: () => Promise<boolean>;
      completeSetup: (settings: Record<string, string>) => Promise<boolean>;

      onWeightUpdate: (callback: (reading: WeightReading) => void) => void;

      onSerialStatus: (callback: (status: SerialStatus) => void) => void;
      getSerialStatus: () => Promise<SerialStatus>;

      log: (level: string, message: string) => void;

      // settings
      getAllSettings: () => Promise<SettingsRow | null>;
      updateSettings: (data: Partial<SettingsRow>) => Promise<boolean>;
    };
  }
}
