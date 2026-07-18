import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AuthStatus } from '@weight/shared/types/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { logger } from '@/lib/logger';

export function SecurityTab() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [desiredMode, setDesiredMode] = useState<'none' | 'required'>('none');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function refreshAuth() {
    const status = await window.electronAPI.getAuthStatus();
    setAuth(status);
    setDesiredMode(status.passwordMode === 'required' ? 'required' : 'none');
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        await refreshAuth();
      } catch (error) {
        logger('error', (error as Error).message);
        toast.error('Could not load security settings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave() {
    if (!auth) return;

    const currentlyRequired = auth.passwordMode === 'required';

    if (desiredMode === 'required') {
      if (newPassword.length < 6) {
        toast.info('Password must be at least 6 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.info('Passwords do not match');
        return;
      }
      if (currentlyRequired && !currentPassword) {
        toast.info('Enter your current password');
        return;
      }
    } else if (currentlyRequired && !currentPassword) {
      toast.info('Enter your current password to switch to passwordless');
      return;
    }

    setSaving(true);
    try {
      if (desiredMode === 'none') {
        const result = currentlyRequired
          ? await window.electronAPI.clearPassword(currentPassword)
          : await window.electronAPI.setPasswordless();
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success('Station is now passwordless');
      } else if (currentlyRequired) {
        const result = await window.electronAPI.changePassword({
          current: currentPassword,
          next: newPassword,
        });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success('Password updated');
      } else {
        const result = await window.electronAPI.setPassword(newPassword);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success('Password enabled for this station');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshAuth();
    } catch (error) {
      logger('error', (error as Error).message);
      toast.error('Could not update security settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Spinner /> Loading security settings…
      </div>
    );
  }

  const currentlyRequired = auth?.passwordMode === 'required';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
        <CardDescription>
          Control whether this station asks for a password on every app launch. Forgetting a
          password requires a new license from Solution Road Tech Support.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm">
          Current mode:{' '}
          <span className="font-medium">
            {currentlyRequired ? 'Password required' : 'Passwordless'}
          </span>
        </div>

        <Field>
          <FieldLabel>Access mode</FieldLabel>
          <RadioGroup
            value={desiredMode}
            onValueChange={(value) => setDesiredMode(value as 'none' | 'required')}
            className="mt-3 grid gap-3"
          >
            <Label
              htmlFor="settings-security-none"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 p-4"
            >
              <RadioGroupItem value="none" id="settings-security-none" className="mt-0.5" />
              <span className="space-y-1">
                <span className="block font-medium">Passwordless</span>
                <span className="text-muted-foreground block text-sm font-normal">
                  No password on app launch.
                </span>
              </span>
            </Label>
            <Label
              htmlFor="settings-security-required"
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/80 p-4"
            >
              <RadioGroupItem value="required" id="settings-security-required" className="mt-0.5" />
              <span className="space-y-1">
                <span className="block font-medium">Require password</span>
                <span className="text-muted-foreground block text-sm font-normal">
                  Ask for a password every time the app opens.
                </span>
              </span>
            </Label>
          </RadioGroup>
        </Field>

        {currentlyRequired && (
          <Field>
            <FieldLabel htmlFor="settings-current-password">Current password</FieldLabel>
            <Input
              id="settings-current-password"
              type="password"
              autoComplete="current-password"
              className="min-h-12"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Required to change security"
            />
            <FieldDescription>
              Needed to change the password or switch to passwordless.
            </FieldDescription>
          </Field>
        )}

        {desiredMode === 'required' && (
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="settings-new-password">
                {currentlyRequired ? 'New password' : 'Password'}
              </FieldLabel>
              <Input
                id="settings-new-password"
                type="password"
                autoComplete="new-password"
                className="min-h-12"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 6 characters"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="settings-confirm-password">Confirm password</FieldLabel>
              <Input
                id="settings-confirm-password"
                type="password"
                autoComplete="new-password"
                className="min-h-12"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
              />
            </Field>
          </div>
        )}

        <Button type="button" disabled={saving} onClick={() => void handleSave()}>
          {saving ? <Spinner /> : null}
          Save security settings
        </Button>
      </CardContent>
    </Card>
  );
}
