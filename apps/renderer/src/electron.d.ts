export interface WeightReading {
  weight: number;
  unit: string;
  raw: string;
}

declare global {
  interface Window {
    electronAPI: {
      onWeightUpdate: (callback: (reading: WeightReading) => void) => void;
    };
  }
}