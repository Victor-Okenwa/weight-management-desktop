import { Check, Copy, KeyRound, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

type SoftwareUnlockStepProps = {
  activated: boolean;
  expiresAt: string;
};

export function SoftwareUnlockStep({ activated, expiresAt }: SoftwareUnlockStepProps) {
  const { control, setValue } = useFormContext<{
    softwareUnlock: {
      licenseJson: string;
      activated: boolean;
      expiresAt: string;
    };
  }>();
  const [machineId, setMachineId] = useState('');
  const [loadingId, setLoadingId] = useState(true);
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMachineId() {
      setLoadingId(true);
      try {
        const id = await window.electronAPI.getMachineId();
        if (!cancelled) {
          setMachineId(id);
        }
      } catch (error) {
        logger('error', (error as Error).message);
        if (!cancelled) {
          toast.error('Could not load Machine ID');
        }
      } finally {
        if (!cancelled) {
          setLoadingId(false);
        }
      }
    }

    void loadMachineId();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCopy() {
    if (!machineId) return;
    try {
      await navigator.clipboard.writeText(machineId);
      setCopied(true);
      toast.success('Machine ID copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy Machine ID');
    }
  }

  async function handleActivate(licenseJson: string) {
    const trimmed = licenseJson.trim();
    if (!trimmed) {
      toast.info('Paste a license JSON first');
      return;
    }

    setActivating(true);
    try {
      const result = await window.electronAPI.activateLicense(trimmed);
      if (!result.ok) {
        setValue('softwareUnlock.activated', false, { shouldValidate: true });
        setValue('softwareUnlock.expiresAt', '', { shouldDirty: true });
        toast.error(result.error);
        return;
      }

      setValue('softwareUnlock.activated', true, { shouldValidate: true });
      setValue('softwareUnlock.expiresAt', result.expiresAt, { shouldDirty: true });
      setValue('softwareUnlock.licenseJson', trimmed, { shouldValidate: true });
      toast.success('Software unlocked for this PC');
    } catch (error) {
      logger('error', (error as Error).message);
      toast.error('Activation failed');
    } finally {
      setActivating(false);
    }
  }

  return (
    <div className="space-y-8">
      <hgroup>
        <h2 className="text-2xl font-bold tracking-tight">Software Unlock</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Activate this station before configuring the weighbridge. Send the Machine ID to Solution
          Road Tech Support, then paste the license they return.
        </p>
      </hgroup>

      <ol className="space-y-6">
        <li className="rounded-lg border border-border/80 bg-background/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="rounded-md px-2 font-mono text-xs">
              1
            </Badge>
            <h3 className="font-semibold">Copy your Machine ID</h3>
          </div>
          <p className="text-muted-foreground mb-4 text-sm">
            Share this ID with Solution Road so they can issue a license for this PC only.
          </p>
          <InputGroup>
            <InputGroupInput
              readOnly
              value={loadingId ? 'Loading…' : machineId}
              className="font-mono text-sm"
              aria-label="Machine ID"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="secondary"
                disabled={loadingId || !machineId}
                onClick={() => void handleCopy()}
              >
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? 'Copied' : 'Copy'}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </li>

        <li className="rounded-lg border border-border/80 bg-background/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="rounded-md px-2 font-mono text-xs">
              2
            </Badge>
            <h3 className="font-semibold">Paste your license</h3>
          </div>
          <FieldGroup>
            <Controller
              name="softwareUnlock.licenseJson"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="software-unlock-license">License JSON</FieldLabel>
                  <FieldDescription>
                    Paste the full license object (machineId, issuedAt, expiresAt, signature).
                  </FieldDescription>
                  <Textarea
                    {...field}
                    id="software-unlock-license"
                    rows={8}
                    spellCheck={false}
                    className="mt-2 font-mono text-xs"
                    placeholder={`{\n  "machineId": "WMS-DEV-…",\n  "issuedAt": "…",\n  "expiresAt": "…",\n  "signature": "…"\n}`}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </li>

        <li className="rounded-lg border border-border/80 bg-background/40 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="rounded-md px-2 font-mono text-xs">
                3
              </Badge>
              <h3 className="font-semibold">Activate</h3>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'rounded-md',
                activated
                  ? 'border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400'
                  : 'text-muted-foreground',
              )}
            >
              {activated ? 'Unlocked' : 'Locked'}
            </Badge>
          </div>
          {activated && expiresAt ? (
            <p className="text-muted-foreground mb-4 text-sm">
              License valid until <span className="font-medium text-foreground">{expiresAt}</span>
            </p>
          ) : (
            <p className="text-muted-foreground mb-4 text-sm">
              Activate to continue to the rest of station setup.
            </p>
          )}
          <Controller
            name="softwareUnlock.licenseJson"
            control={control}
            render={({ field }) => (
              <Button
                type="button"
                disabled={activating || !field.value?.trim()}
                onClick={() => void handleActivate(field.value)}
              >
                {activating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <KeyRound className="size-4" />
                )}
                {activated ? 'Re-activate' : 'Activate license'}
              </Button>
            )}
          />
          <Controller
            name="softwareUnlock.activated"
            control={control}
            render={({ fieldState }) => (
              <>
                {fieldState.invalid ? (
                  <p className="text-destructive mt-3 text-sm">
                    {fieldState.error?.message ?? 'Activate the license to continue'}
                  </p>
                ) : null}
              </>
            )}
          />
        </li>
      </ol>
    </div>
  );
}
