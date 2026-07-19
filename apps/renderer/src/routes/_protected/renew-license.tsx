/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link, useRouter } from '@tanstack/react-router';
import { KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { formatLicenseExpiry, parseLicenseExpiresAt } from '@/components/setup/license-expiry';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';

export const Route = createFileRoute('/_protected/renew-license')({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const [machineId, setMachineId] = useState('');
  const [licenseJson, setLicenseJson] = useState('');
  const [activating, setActivating] = useState(false);
  const [pastedExpiryNotice, setPastedExpiryNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const id = await window.electronAPI.getMachineId();
        if (!cancelled) setMachineId(id);
      } catch (error) {
        logger('error', (error as Error).message);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function announceExpiry(raw: string) {
    const expiresAt = parseLicenseExpiresAt(raw);
    const readable = formatLicenseExpiry(expiresAt);
    if (!readable) {
      setPastedExpiryNotice(null);
      return;
    }
    setPastedExpiryNotice(
      `New license will expire on ${readable}. Request the next renewal from Solution Road Tech Support before then.`,
    );
  }

  async function handleRenew() {
    const trimmed = licenseJson.trim();
    if (!trimmed) {
      toast.info('Paste a license JSON first');
      return;
    }

    setActivating(true);
    try {
      const result = await window.electronAPI.activateLicense(trimmed);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success('License renewed successfully');
      toast.info(
        'App password was cleared for this renewal. Set a new password in Settings → Security if needed.',
        { duration: 8000 },
      );
      await router.navigate({ to: '/license' });
    } catch (error) {
      logger('error', (error as Error).message);
      toast.error('Could not renew license');
    } finally {
      setActivating(false);
    }
  }

  return (
    <article className="space-y-6 px-4 py-6 md:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Renew license</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Send your Machine ID to Solution Road Tech Support, then paste the new license they
          return. Renewing replaces the current license and clears the station password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5" />
            Paste new license
          </CardTitle>
          <CardDescription>
            Machine ID for this PC:{' '}
            <span className="font-mono text-foreground">{machineId || '…'}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="renew-license-json">License JSON</FieldLabel>
            <FieldDescription>
              Full object with machineId, issuedAt, expiresAt, and signature.
            </FieldDescription>
            <Textarea
              id="renew-license-json"
              rows={10}
              spellCheck={false}
              className="mt-2 font-mono text-xs"
              value={licenseJson}
              placeholder={`{\n  "machineId": "${machineId || 'WMS-…'}",\n  "issuedAt": "…",\n  "expiresAt": "…",\n  "signature": "…"\n}`}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                window.setTimeout(() => announceExpiry(pasted || licenseJson), 0);
              }}
              onChange={(event) => {
                setLicenseJson(event.target.value);
                if (!event.target.value.trim()) setPastedExpiryNotice(null);
              }}
            />
            {pastedExpiryNotice ? (
              <p className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
                {pastedExpiryNotice}
              </p>
            ) : null}
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={activating || !licenseJson.trim()}
              onClick={() => void handleRenew()}
            >
              {activating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4" />
              )}
              Activate renewed license
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/license">Back to license</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
