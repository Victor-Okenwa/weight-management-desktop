import { Link, useRouterState } from '@tanstack/react-router';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { availableUpdateVersion, useUpdateStore } from '@/store/updateStore';

export function SoftwareUpdateBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const status = useUpdateStore((s) => s.status);
  const availableVersion = availableUpdateVersion(status);

  if (pathname === '/software-update') return null;
  if (!availableVersion) return null;
  if (status.kind !== 'available' && status.kind !== 'ready' && status.kind !== 'downloading') {
    return null;
  }

  const message =
    status.kind === 'ready'
      ? `Update v${availableVersion} is ready to install.`
      : status.kind === 'downloading'
        ? `Downloading update v${availableVersion}… ${status.percent}%`
        : `Software update v${availableVersion} is available.`;

  const actionLabel =
    status.kind === 'ready'
      ? 'Install now'
      : status.kind === 'downloading'
        ? 'View progress'
        : 'Update now';

  return (
    <div
      className={cn(
        'border-b px-3 py-2',
        status.kind === 'ready'
          ? 'border-green-600/30 bg-green-600/10'
          : 'border-amber-600/30 bg-amber-600/10',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            'text-sm',
            status.kind === 'ready'
              ? 'text-green-950 dark:text-green-100'
              : 'text-amber-950 dark:text-amber-100',
          )}
        >
          {message}
        </p>
        <Button size="sm" asChild className="h-7 shrink-0">
          <Link to="/software-update">
            <Download className="size-3.5" />
            {actionLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}
