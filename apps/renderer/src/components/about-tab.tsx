import { Info, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Spinner } from './ui/spinner';

type UpdateStatusEvent =
  | { type: 'checking' }
  | { type: 'available'; version: string }
  | { type: 'not-available'; version: string }
  | { type: 'progress'; percent: number; transferred: number; total: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string };

type UpdateUiState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available'; version: string }
  | { kind: 'up-to-date'; version: string }
  | { kind: 'downloading'; percent: number }
  | { kind: 'ready'; version: string }
  | { kind: 'error'; message: string };

function statusFromEvent(event: UpdateStatusEvent): UpdateUiState {
  switch (event.type) {
    case 'checking':
      return { kind: 'checking' };
    case 'available':
      return { kind: 'available', version: event.version };
    case 'not-available':
      return { kind: 'up-to-date', version: event.version };
    case 'progress':
      return { kind: 'downloading', percent: Math.round(event.percent) };
    case 'downloaded':
      return { kind: 'ready', version: event.version };
    case 'error':
      return { kind: 'error', message: event.message };
  }
}

function statusLabel(state: UpdateUiState): string {
  switch (state.kind) {
    case 'idle':
      return 'No update check yet.';
    case 'checking':
      return 'Checking for updates…';
    case 'available':
      return `Update ${state.version} is available.`;
    case 'up-to-date':
      return `You are on the latest version (${state.version}).`;
    case 'downloading':
      return `Downloading update… ${state.percent}%`;
    case 'ready':
      return `Update ${state.version} downloaded. Restart to install.`;
    case 'error':
      return state.message;
  }
}

export function AboutTab() {
  const [version, setVersion] = useState<string>('…');
  const [state, setState] = useState<UpdateUiState>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void window.electronAPI.getAppVersion().then((v) => {
      if (!cancelled) setVersion(v);
    });
    const unsubscribe = window.electronAPI.onUpdateStatus((event) => {
      setState(statusFromEvent(event));
      if (event.type === 'error') {
        toast.error(event.message);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  async function handleCheck() {
    setBusy(true);
    try {
      await window.electronAPI.checkForUpdates();
    } catch (error) {
      const message = (error as Error).message || 'Failed to check for updates';
      setState({ kind: 'error', message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDownload() {
    setBusy(true);
    try {
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      const message = (error as Error).message || 'Failed to download update';
      setState({ kind: 'error', message });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleInstall() {
    setBusy(true);
    try {
      await window.electronAPI.installUpdate();
    } catch (error) {
      const message = (error as Error).message || 'Failed to install update';
      setState({ kind: 'error', message });
      toast.error(message);
      setBusy(false);
    }
  }

  const canDownload = state.kind === 'available';
  const canInstall = state.kind === 'ready';

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
        <CardDescription>
          App version and software updates from the private GitHub release feed.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Info className="size-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">Solution Road Weight Management</p>
            <p className="font-mono text-sm text-muted-foreground">Version {version}</p>
            <p className="text-sm text-muted-foreground">{statusLabel(state)}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={busy || state.kind === 'checking' || state.kind === 'downloading'}
            onClick={() => void handleCheck()}
          >
            {state.kind === 'checking' ? (
              <>
                <Spinner /> Checking…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Check for updates
              </>
            )}
          </Button>

          {canDownload ? (
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="min-w-40"
              onClick={() => void handleDownload()}
            >
              {busy ? (
                <>
                  <Spinner /> Starting…
                </>
              ) : (
                'Download update'
              )}
            </Button>
          ) : null}

          {state.kind === 'downloading' ? (
            <Button type="button" size="lg" disabled className="min-w-40">
              <Spinner /> {state.percent}%
            </Button>
          ) : null}

          {canInstall ? (
            <Button
              type="button"
              size="lg"
              disabled={busy}
              className="min-w-44"
              onClick={() => void handleInstall()}
            >
              {busy ? (
                <>
                  <Spinner /> Restarting…
                </>
              ) : (
                'Restart to install'
              )}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
