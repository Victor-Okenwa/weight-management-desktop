import { create } from 'zustand';
import type { WeightReading } from '@weight/shared/types/index';

interface WeightState {
  latestReading: WeightReading | null;
  stableReading: WeightReading | null;
  setLatestReading: (reading: WeightReading) => void;
  setStableReading: (reading: WeightReading) => void;
}

export const useWeightStore = create<WeightState>((set) => ({
  latestReading: null,
  stableReading: null,
  setLatestReading: (reading) => set({ latestReading: reading }),
  setStableReading: (reading) => set({ stableReading: reading }),
}));