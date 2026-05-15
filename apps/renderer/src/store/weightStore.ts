import { create } from 'zustand';

export interface WeightReading {
  weight: number;
  unit: string;
  raw: string;
}


interface WeightState {
  latestReading: WeightReading | null;
  setLatestReading: (reading: WeightReading) => void;
}

export const useWeightStore = create<WeightState>((set) => ({
  latestReading: null,
  setLatestReading: (reading) => set({ latestReading: reading }),
}));