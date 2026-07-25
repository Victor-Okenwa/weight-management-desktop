import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { availableUpdateVersion, useUpdateStore } from '@/store/updateStore';

export function useAppUpdates() {
  const router = useRouter();
  const applyEvent = useUpdateStore((s) => s.applyEvent);
  const setCurrentVersion = useUpdateStore((s) => s.setCurrentVersion);
  const setNotifiedVersion = useUpdateStore((s) => s.setNotifiedVersion);

  useEffect(() => {
    if (!window.electronAPI?.onUpdateStatus) return;

    void window.electronAPI.getAppVersion().then(setCurrentVersion);

    const unsubscribe = window.electronAPI.onUpdateStatus((event) => {
      applyEvent(event);

      if (event.type === 'error') {
        toast.error(event.message);
        return;
      }

      if (event.type === 'available') {
        const alreadyTold = useUpdateStore.getState().notifiedVersion;
        if (alreadyTold === event.version) return;
        setNotifiedVersion(event.version);
        toast.message(`Software update ${event.version} is available`, {
          description: 'Download and install from the Software Update page.',
          action: {
            label: 'View update',
            onClick: () => {
              void router.navigate({ to: '/software-update' });
            },
          },
          duration: 12_000,
        });
      }

      if (event.type === 'downloaded') {
        toast.success(`Update ${event.version} downloaded`, {
          description: 'Restart to install from the Software Update page.',
          action: {
            label: 'Install',
            onClick: () => {
              void router.navigate({ to: '/software-update' });
            },
          },
          duration: 12_000,
        });
      }
    });

    return unsubscribe;
  }, [applyEvent, router, setCurrentVersion, setNotifiedVersion]);
}

export async function checkForUpdatesAction() {
  const { setBusy, setStatus } = useUpdateStore.getState();
  setBusy(true);
  try {
    await window.electronAPI.checkForUpdates();
  } catch (error) {
    const message = (error as Error).message || 'Failed to check for updates';
    setStatus({ kind: 'error', message });
    toast.error(message);
  } finally {
    setBusy(false);
  }
}

export async function downloadUpdateAction() {
  const { setBusy, setStatus, status } = useUpdateStore.getState();
  setBusy(true);
  try {
    const version = availableUpdateVersion(status) ?? undefined;
    if (status.kind === 'available') {
      setStatus({ kind: 'downloading', percent: 0, version: status.version });
    } else if (version) {
      setStatus({ kind: 'downloading', percent: 0, version });
    }
    await window.electronAPI.downloadUpdate();
  } catch (error) {
    const message = (error as Error).message || 'Failed to download update';
    setStatus({ kind: 'error', message });
    toast.error(message);
  } finally {
    setBusy(false);
  }
}

export async function installUpdateAction() {
  const { setBusy, setStatus } = useUpdateStore.getState();
  setBusy(true);
  try {
    await window.electronAPI.installUpdate();
  } catch (error) {
    const message = (error as Error).message || 'Failed to install update';
    setStatus({ kind: 'error', message });
    toast.error(message);
    setBusy(false);
  }
}
