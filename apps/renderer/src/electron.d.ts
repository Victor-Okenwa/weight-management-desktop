import type { SerialStatus, WeightReading } from '@weight/shared';

declare global {
  interface Window {
    electronAPI: {
      onWeightUpdate: (callback: (reading: WeightReading) => void) => void;
      onSerialStatus: (callback: (status: SerialStatus) => void) => void;
    };
  }
}
