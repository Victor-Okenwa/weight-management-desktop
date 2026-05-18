import type { SerialStatus, WeightReading } from '@weight/shared/types/index';
import { create } from 'zustand';

interface WeightState {
  latestReading: WeightReading | null;
  serialStatus: SerialStatus;
  setLatestReading: (reading: WeightReading) => void;
  setSerialStatus: (status: WeightState['serialStatus']) => void;
}

export const useWeightStore = create<WeightState>((set) => ({
  latestReading: null,
  serialStatus: 'connecting',
  setLatestReading: (reading) => set({ latestReading: reading }),
  setSerialStatus: (status) => set({ serialStatus: status }),
}));
