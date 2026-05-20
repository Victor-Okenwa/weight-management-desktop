import { create } from 'zustand';

interface SettingsState {
  settings: Record<string, string>;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  loadSettings: async () => {
    if (window.electronAPI) {
      const all = await window.electronAPI.getAllSettings();
      set({ settings: all });
    }
  },
  updateSetting: async (key, value) => {
    if (window.electronAPI) {
      await window.electronAPI.setSetting(key, value);
      // Optimistically update local state
      set((state) => ({
        settings: { ...state.settings, [key]: value },
      }));
    }
  },
}));
