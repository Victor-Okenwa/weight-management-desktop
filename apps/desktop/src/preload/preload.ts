import type { WeightReading } from '@weight/shared/types/index';
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
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
});
