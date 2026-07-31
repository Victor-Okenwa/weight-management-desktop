/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router';
import { ArrowDownToLine, CheckCircle2, Download, RefreshCw, Rocket } from 'lucide-react';
import { useEffect } from 'react';
import {
  checkForUpdatesAction,
  downloadUpdateAction,
  installUpdateAction,
} from '@/hooks/use-app-updates';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { availableUpdateVersion, useUpdateStore } from '@/store/updateStore';

export const Route = createFileRoute('/_protected/software-update')({
  component: RouteComponent,
});

function RouteComponent() {
  const currentVersion = useUpdateStore((s) => s.currentVersion);
  const status = useUpdateStore((s) => s.status);
  const busy = useUpdateStore((s) => s.busy);
  const availableVersion = availableUpdateVersion(status);

  useEffect(() => {
    if (!window.electronAPI?.getAppVersion) return;
    void window.electronAPI.getAppVersion().then((version) => {
      useUpdateStore.getState().setCurrentVersion(version);
    });
  }, []);

  const isCheckingConnectivity = status.kind === 'checking-connectivity';
  const isCheckingStore = status.kind === 'checking-store';
  const isChecking = status.kind === 'checking';
  const isCheckingAnyStage = isCheckingConnectivity || isCheckingStore || isChecking;
  const isDownloading = status.kind === 'downloading';
  const canDownload = status.kind === 'available';
  const canInstall = status.kind === 'ready';
  const isUpToDate = status.kind === 'up-to-date';

  const checkingLabel = isCheckingConnectivity
    ? 'Checking internet connectivity…'
    : isCheckingStore
      ? 'Reaching binary store…'
      : 'Checking for updates…';

  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Software Update</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check for a newer version, download it, then restart to install.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="size-5" />
              Application version
            </CardTitle>
            <CardDescription className="mt-1">
              Solution Road Weight Management on this station.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              availableVersion
                ? 'border-amber-600/40 bg-amber-600/10 text-amber-800 dark:text-amber-300'
                : isUpToDate
                  ? 'border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400'
                  : 'text-muted-foreground',
            )}
          >
            {availableVersion
              ? 'Update available'
              : isUpToDate
                ? 'Up to date'
                : isCheckingAnyStage
                  ? checkingLabel
                  : isDownloading
                    ? 'Downloading…'
                    : canInstall
                      ? 'Ready to install'
                      : 'Status unknown'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Current version
              </p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {currentVersion ? `v${currentVersion}` : '…'}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                Available version
              </p>
              <p className="mt-1 font-mono text-lg font-semibold">
                {availableVersion ? `v${availableVersion}` : isUpToDate ? 'Same as current' : '—'}
              </p>
            </div>
          </div>

          {availableVersion && status.kind === 'available' ? (
            <div className="rounded-lg border border-amber-600/30 bg-amber-600/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
              A software update is available. Download version{' '}
              <span className="font-mono font-semibold">v{availableVersion}</span>, then restart to
              install it on this station.
            </div>
          ) : null}

          {status.kind === 'ready' ? (
            <div className="rounded-lg border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-950 dark:text-green-100">
              Version <span className="font-mono font-semibold">v{status.version}</span> is
              downloaded. Restart now to finish installing the update.
            </div>
          ) : null}

          {status.kind === 'downloading' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Downloading{status.version ? ` v${status.version}` : ''}…
                </span>
                <span className="font-mono font-medium">{status.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, status.percent))}%` }}
                />
              </div>
            </div>
          ) : null}

          {status.kind === 'error' ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {status.message}
            </div>
          ) : null}

          {isUpToDate ? (
            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600 dark:text-green-400" />
              <p>
                You are running the latest version
                {currentVersion ? (
                  <>
                    {' '}
                    (<span className="font-mono">v{currentVersion}</span>)
                  </>
                ) : null}
                .
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy || isCheckingAnyStage || isDownloading}
              onClick={() => void checkForUpdatesAction()}
            >
              {isCheckingAnyStage ? (
                <>
                  <Spinner /> {checkingLabel}
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
                className="min-w-44"
                onClick={() => void downloadUpdateAction()}
              >
                {busy ? (
                  <>
                    <Spinner /> Starting…
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Download v{availableVersion}
                  </>
                )}
              </Button>
            ) : null}

            {isDownloading ? (
              <Button type="button" size="lg" disabled className="min-w-44">
                <Spinner /> Downloading…
              </Button>
            ) : null}

            {canInstall ? (
              <Button
                type="button"
                size="lg"
                disabled={busy}
                className="min-w-48"
                onClick={() => void installUpdateAction()}
              >
                {busy ? (
                  <>
                    <Spinner /> Restarting…
                  </>
                ) : (
                  <>
                    <ArrowDownToLine className="size-4" />
                    Restart to install
                  </>
                )}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
