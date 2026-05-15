import { create } from 'zustand';
import type { WeightReading } from '@weight/shared/types/index';

interface WeightState {
  latestReading: WeightReading | null;
  setLatestReading: (reading: WeightReading) => void;
}

export const useWeightStore = create<WeightState>((set) => ({
  latestReading: null,
  setLatestReading: (reading) => set({ latestReading: reading }),
}));