import type { SettingsRow } from '@weight/shared/types/index';
import { create } from 'zustand';

interface SettingsState {
  settings: SettingsRow | null;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loadSettings: async () => {
    if (window.electronAPI) {
      const all = await window.electronAPI.getAllSettings();
      set({ settings: all });
    }
  },
}));
