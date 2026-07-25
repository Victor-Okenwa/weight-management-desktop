import { Info } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { checkForUpdatesAction } from '@/hooks/use-app-updates';
import { availableUpdateVersion, useUpdateStore } from '@/store/updateStore';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AboutTab() {
  const currentVersion = useUpdateStore((s) => s.currentVersion);
  const status = useUpdateStore((s) => s.status);
  const availableVersion = availableUpdateVersion(status);

  useEffect(() => {
    if (!window.electronAPI?.getAppVersion) return;
    void window.electronAPI.getAppVersion().then((version) => {
      useUpdateStore.getState().setCurrentVersion(version);
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
        <CardDescription>
          App identity for this station. Use Software Update to download and install newer versions.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
            <Info className="size-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-foreground">Solution Road Weight Management</p>
            <p className="font-mono text-sm text-muted-foreground">
              Version {currentVersion ?? '…'}
            </p>
            {availableVersion ? (
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Update v{availableVersion} is available.
              </p>
            ) : status.kind === 'up-to-date' ? (
              <p className="text-sm text-muted-foreground">You are on the latest version.</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Open Software Update to check for a newer release.
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-5">
          <Button type="button" variant="outline" size="lg" onClick={() => void checkForUpdatesAction()}>
            Check for updates
          </Button>
          <Button type="button" size="lg" asChild className="min-w-44">
            <Link to="/software-update">Software Update</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
