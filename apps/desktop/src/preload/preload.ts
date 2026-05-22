import type { SettingsRow, WeightReading } from '@weight/shared/types/index';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  isSetupCompleted: (): Promise<boolean> => ipcRenderer.invoke('app:is-setup-completed'),
  completeSetup: (settings: Record<string, string>): Promise<boolean> =>
    ipcRenderer.invoke('app:complete-setup', settings),

  onWeightUpdate: (callback: (reading: WeightReading) => void) => {
    // Remove any previous listeners to avoid duplicates
    ipcRenderer.removeAllListeners('weight:update');
    ipcRenderer.on('weight:update', (_event, reading) => {
      callback(reading);
    });
  },
  onSerialStatus: (callback: (status: string) => void) => {
    ipcRenderer.removeAllListeners('serial:status');
    ipcRenderer.on('serial:status', (_event, status) => {
      callback(status);
    });
  },
  getSerialStatus: (): Promise<string> => ipcRenderer.invoke('serial:get-status'),
  log: (level: string, message: string) => {
    ipcRenderer.send('log', { level, message });
  },
  // Later you can add more methods:
  // getSettings, setSettings, etc.
  getAllSettings: (): Promise<SettingsRow | null> => ipcRenderer.invoke('settings:get-all'),
  updateSettings: (data: Record<string, any>): Promise<boolean> =>
    ipcRenderer.invoke('settings:update', data),
});
