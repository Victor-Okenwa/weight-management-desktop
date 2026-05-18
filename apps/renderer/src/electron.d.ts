import type { WeightReading } from '@weight/shared';

declare global {
  interface Window {
    electronAPI: {
      onWeightUpdate: (callback: (reading: WeightReading) => void) => void;
    };
  }
}
