import { create } from 'zustand';

export type UpdateStatusEvent =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available'; version: string }
  | { type: 'progress'; percent: number; transferred: number; total: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string };

export type UpdateUiState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available'; version: string }
  | { kind: 'up-to-date'; version: string }
  | { kind: 'downloading'; percent: number; version?: string }
  | { kind: 'ready'; version: string }
  | { kind: 'error'; message: string };

interface UpdateState {
  currentVersion: string | null;
  status: UpdateUiState;
  busy: boolean;
  /** Prevents toast spam when the same available version is reported again */
  notifiedVersion: string | null;
  setCurrentVersion: (version: string) => void;
  setStatus: (status: UpdateUiState) => void;
  setBusy: (busy: boolean) => void;
  setNotifiedVersion: (version: string | null) => void;
  applyEvent: (event: UpdateStatusEvent) => void;
}

function statusFromEvent(event: UpdateStatusEvent, prev: UpdateUiState): UpdateUiState {
  switch (event.type) {
    case 'checking':
      return { kind: 'checking' };
    case 'available':
      return { kind: 'available', version: event.version };
    case 'not-available':
      return { kind: 'up-to-date', version: event.version };
    case 'progress': {
      const version =
        prev.kind === 'available' || prev.kind === 'downloading' || prev.kind === 'ready'
          ? prev.version
          : undefined;
      return { kind: 'downloading', percent: Math.round(event.percent), version };
    }
    case 'downloaded':
      return { kind: 'ready', version: event.version };
    case 'error':
      return { kind: 'error', message: event.message };
  }
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  currentVersion: null,
  status: { kind: 'idle' },
  busy: false,
  notifiedVersion: null,
  setCurrentVersion: (version) => set({ currentVersion: version }),
  setStatus: (status) => set({ status }),
  setBusy: (busy) => set({ busy }),
  setNotifiedVersion: (version) => set({ notifiedVersion: version }),
  applyEvent: (event) => {
    set({ status: statusFromEvent(event, get().status) });
  },
}));

export function availableUpdateVersion(status: UpdateUiState): string | null {
  if (status.kind === 'available' || status.kind === 'ready') return status.version;
  if (status.kind === 'downloading' && status.version) return status.version;
  return null;
}
