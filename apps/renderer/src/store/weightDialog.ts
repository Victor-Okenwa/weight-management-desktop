import { create } from 'zustand';

type WeightDialogsState = {
  isNewWeightDialogOpen: boolean;
  isUpdateWeightDialogOpen: boolean;
  setNewWeightDialogOpen: (open: boolean) => void;
  setUpdateWeightDialogOpen: (open: boolean) => void;
};

export const useWeightDialogsStore = create<WeightDialogsState>((set) => ({
  isNewWeightDialogOpen: false,
  isUpdateWeightDialogOpen: false,
  setNewWeightDialogOpen: (open) => set({ isNewWeightDialogOpen: open }),
  setUpdateWeightDialogOpen: (open) => set({ isUpdateWeightDialogOpen: open }),
}));
