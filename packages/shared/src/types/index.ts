export interface WeightReading {
  weight: number;
  unit: string;
  raw: string;
  isStable: boolean;
}

export type SerialStatus = 'connected' | 'disconnected' | 'error' | 'idle';
