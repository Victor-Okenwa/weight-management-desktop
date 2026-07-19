/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link } from '@tanstack/react-router';
import type { LicenseStatus } from '@weight/shared/types/index';
import { Copy, KeyRound, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  formatDaysRemaining,
  formatLicenseDateShort,
  formatLicenseExpiry,
} from '@/components/setup/license-expiry';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_protected/license')({
  component: RouteComponent,
});

function RouteComponent() {
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await window.electronAPI.getLicenseStatus();
        if (!cancelled) setStatus(next);
      } catch (error) {
        logger('error', (error as Error).message);
        toast.error('Could not load license details');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function copyMachineId() {
    if (!status?.machineId) return;
    try {
      await navigator.clipboard.writeText(status.machineId);
      toast.success('Machine ID copied');
    } catch {
      toast.error('Could not copy Machine ID');
    }
  }

  if (loading) {
    return (
      <article className="px-4 py-8">
        <p className="text-muted-foreground text-sm">Loading license…</p>
      </article>
    );
  }

  const expiresLabel = formatLicenseExpiry(status?.expiresAt);
  const issuedLabel = formatLicenseDateShort(status?.issuedAt);
  const daysLabel = formatDaysRemaining(status?.daysRemaining);

  return (
    <article className="space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">License</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            View this station’s entitlement. Contact Solution Road Tech Support to renew.
          </p>
        </div>
        <Button asChild>
          <Link to="/renew-license">
            <RefreshCw className="size-4" />
            Renew license
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" />
              Station license
            </CardTitle>
            <CardDescription className="mt-1">Bound to this PC’s Machine ID.</CardDescription>
          </div>
          <Badge
            variant="outline"
            className={cn(
              status?.activated
                ? status.isExpiringSoon
                  ? 'border-red-600/40 bg-red-600/10 text-red-700 dark:text-red-400'
                  : 'border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400'
                : 'text-muted-foreground',
            )}
          >
            {!status?.activated ? 'Inactive' : status.isExpiringSoon ? 'Expiring soon' : 'Active'}
          </Badge>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Machine ID
              </dt>
              <dd className="flex items-center gap-2 font-mono text-sm break-all">
                {status?.machineId || '—'}
                {status?.machineId ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label="Copy Machine ID"
                    onClick={() => void copyMachineId()}
                  >
                    <Copy className="size-4" />
                  </Button>
                ) : null}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Time remaining
              </dt>
              <dd
                className={cn(
                  'text-sm font-medium',
                  status?.isExpiringSoon && 'text-red-700 dark:text-red-400',
                )}
              >
                {daysLabel}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Issued
              </dt>
              <dd className="text-sm">{issuedLabel || '—'}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Expires
              </dt>
              <dd className="text-sm font-medium">{expiresLabel || '—'}</dd>
            </div>
          </dl>

          {status?.isExpiringSoon ? (
            <p className="mt-6 rounded-md border border-red-600/30 bg-red-600/10 px-3 py-2 text-sm text-red-900 dark:text-red-200">
              This license expires soon. Request a new license from Solution Road Tech Support and
              paste it on the Renew page before it expires.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </article>
  );
}
