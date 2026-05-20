import type { SerialStatus, WeightReading } from '@weight/shared';

declare global {
  interface Window {
    electronAPI: {
      isSetupCompleted: () => Promise<boolean>;
      completeSetup: (settings: Record<string, string>) => Promise<boolean>;

      onWeightUpdate: (callback: (reading: WeightReading) => void) => void;

      onSerialStatus: (callback: (status: SerialStatus) => void) => void;
      getSerialStatus: () => Promise<SerialStatus>;

      log: (level: string, message: string) => void;

      // settings
      getSetting: (key: string) => Promise<string | undefined>;
      getAllSettings: () => Promise<Record<string, string>>;
      setSetting: (key: string, value: string) => Promise<boolean>;
      setSetting: (key: string, value: string) => Promise<boolean>;
      setMultipleSettings: (settings: Record<string, string>) => Promise<boolean>;
    };
  }
}
