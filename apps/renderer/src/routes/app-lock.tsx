/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { KeyRound, Loader2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { logger } from '@/lib/logger';

export const Route = createFileRoute('/app-lock')({
  component: RouteComponent,
  beforeLoad: async () => {
    if (typeof window === 'undefined' || !window.electronAPI?.getAuthStatus) {
      return;
    }

    const [setupCompleted, licenseStatus, authStatus] = await Promise.all([
      window.electronAPI.isSetupCompleted(),
      window.electronAPI.getLicenseStatus(),
      window.electronAPI.getAuthStatus(),
    ]);

    if (!setupCompleted || !licenseStatus.activated) {
      throw redirect({ to: '/setup-wizard' });
    }

    if (authStatus.passwordMode !== 'required' || authStatus.sessionUnlocked) {
      throw redirect({ to: '/' });
    }
  },
});

function RouteComponent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function handleUnlock(event: FormEvent) {
    event.preventDefault();
    if (!password.trim()) {
      toast.info('Enter your station password');
      return;
    }

    setUnlocking(true);
    try {
      const result = await window.electronAPI.verifyPassword(password);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      await router.navigate({ to: '/' });
    } catch (error) {
      logger('error', (error as Error).message);
      toast.error('Could not verify password');
    } finally {
      setUnlocking(false);
    }
  }

  async function handleForgotConfirm() {
    setResetting(true);
    try {
      const result = await window.electronAPI.forgotPasswordReset();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('License cleared. Request a new license from Solution Road Tech Support.');
      await router.navigate({ to: '/setup-wizard' });
    } catch (error) {
      logger('error', (error as Error).message);
      toast.error('Could not reset station access');
    } finally {
      setResetting(false);
    }
  }

  return (
    <article className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="bg-background w-full max-w-md overflow-hidden border-border/70 shadow-sm">
        <div className="flex items-start gap-4 border-b border-border/60 px-6 py-6">
          <Badge className="size-12 shrink-0 rounded-md [&>svg]:size-7!">
            <KeyRound />
          </Badge>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-sky-600 dark:text-sky-400">
              Station locked
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Enter password</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              This station requires a password each time the app opens.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleUnlock(event)} className="space-y-5 px-6 py-6">
          <Field>
            <FieldLabel htmlFor="app-lock-password">Password</FieldLabel>
            <Input
              id="app-lock-password"
              type="password"
              autoFocus
              autoComplete="current-password"
              className="min-h-12"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Station password"
            />
          </Field>

          <Button type="submit" className="w-full" disabled={unlocking || resetting}>
            {unlocking ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            Unlock
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                disabled={unlocking || resetting}
              >
                Forgot password?
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset station access?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>This cannot be undone from the app. If you continue:</p>
                    <ul className="list-disc space-y-1 pl-5">
                      <li>The stored license on this PC will be cleared</li>
                      <li>Your app password will be removed</li>
                      <li>Setup will reopen at Software Unlock</li>
                      <li>
                        You must request a <strong>new license</strong> from Solution Road Tech
                        Support before the station can be used again
                      </li>
                    </ul>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={resetting}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleForgotConfirm();
                  }}
                >
                  {resetting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Clear license and continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </form>
      </Card>
    </article>
  );
}
