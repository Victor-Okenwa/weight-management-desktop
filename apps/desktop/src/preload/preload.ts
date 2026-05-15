import { contextBridge, ipcRenderer } from 'electron';
import type { WeightReading } from "@weight/shared/types/index";

contextBridge.exposeInMainWorld('electronAPI', {
    onWeightUpdate: (callback: (reading: WeightReading) => void) => {
    // Remove any previous listeners to avoid duplicates
    ipcRenderer.removeAllListeners('weight:update');
    ipcRenderer.on('weight:update', (_event, reading) => callback(reading));
  },
    // Later you can add more methods:
  // getSettings, setSettings, etc.
})