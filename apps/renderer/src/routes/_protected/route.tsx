/* eslint-disable react-refresh/only-export-components */
import { createFileRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import type { SettingsRow } from '@weight/shared/types/index';
import {
  HistoryIcon,
  LayoutDashboard,
  Loader2,
  Settings2,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
  Weight,
  X,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { AppFooter } from '@/components/app-footer';
import { NotFound } from '@/components/not-found';
import { type Theme, useTheme } from '@/components/providers/theme-provider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useWeightUpdates } from '@/hooks/use-weight-updates';
import { logger } from '@/lib/logger';
import { useSettingsStore } from '@/store/settingsStore';
import { useWeightStore } from '@/store/weightStore';

const sidebarRoutes = [
  {
    icon: LayoutDashboard,
    link: '/',
    label: 'Dashboard',
  },
  {
    icon: Weight,
    link: '/record-weight',
    label: 'Record Weight',
  },
  {
    icon: HistoryIcon,
    link: '/history',
    label: 'History',
  },
  {
    icon: Settings2,
    link: '/settings',
    label: 'Settings',
  },
];

export const Route = createFileRoute('/_protected')({
  component: RouteComponent,
  beforeLoad: async () => {
    // If running in browser (not electron), skip setup check
    if (typeof window === 'undefined' || !window.electronAPI?.isSetupCompleted) {
      return;
    }

    const [setupCompleted, licenseStatus, authStatus] = await Promise.all([
      window.electronAPI.isSetupCompleted(),
      window.electronAPI.getLicenseStatus(),
      window.electronAPI.getAuthStatus(),
    ]);

    // Need wizard when setup unfinished, or when unlock is no longer valid
    // (expired license / different motherboard after hardware change).
    if (!setupCompleted || !licenseStatus.activated) {
      window.electronAPI.log(
        'info',
        !setupCompleted
          ? 'Setup not completed — opening setup wizard'
          : 'License not active — opening setup wizard for unlock',
      );

      throw redirect({
        to: '/setup-wizard',
      });
    }

    if (authStatus.passwordMode === 'required' && !authStatus.sessionUnlocked) {
      window.electronAPI.log('info', 'Password required — opening app lock');
      throw redirect({
        to: '/app-lock',
      });
    }
  },
  notFoundComponent: () => {
    return <NotFound />;
  },
});

function RouteComponent() {
  useWeightUpdates(); // start listening to updates

  const { loadSettings, settings } = useSettingsStore();
  const { setTheme } = useTheme();

  useEffect(() => {
    async function fetchSettings() {
      await loadSettings();

      setTheme(settings?.theme as Theme);
    }
    fetchSettings();
  }, [loadSettings, setTheme, settings?.theme]);

  return (
    <SidebarProvider>
      <AppSidebar settings={settings} />

      <div className="w-full">
        <main>
          <TopBar />
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ settings }: { settings: SettingsRow | null }) {
  // Get the current location from TanStack Router
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <Sidebar>
      {/* <SidebarHeader /> */}
      <SidebarContent>
        <SidebarGroup>
          {sidebarRoutes.map(({ icon: Icon, link, label }) => {
            const isActive =
              currentPath === link || (link === '/' && currentPath === '/_protected/');
            return (
              <Link
                key={link}
                to={link}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors gap-2 ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AlertDialog>
          <AlertDialogTrigger className="flex gap-2 items-center max-w-full bg-secondary py-2 px-1 border-t">
            <span className="size-10 rounded-full bg-secondary capitalize font-bold text-base text-center place-content-center shadow">
              {settings?.companyName?.[0]}
            </span>

            <div className="overflow-clip max-w-[80%]">
              <span className="capitalize truncate text-sm">{settings?.companyName}</span>
              <p className="text-xs truncate text-accent">{settings?.companyEmail}</p>
            </div>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogCancel className="absolute top-3 right-3">
                <X />
              </AlertDialogCancel>
              <AlertDialogTitle>Company Details</AlertDialogTitle>
            </AlertDialogHeader>

            <div>
              <div className="space-y-4">
                <div>
                  <span className="block font-semibold text-sm mb-1">Name</span>
                  <span className="capitalize">
                    {settings?.companyName?.trim() ? (
                      settings.companyName
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </span>
                </div>
                <hr />
                <div>
                  <span className="block font-semibold text-sm mb-1">Email</span>
                  <span>
                    {settings?.companyEmail?.trim() ? (
                      settings.companyEmail
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </span>
                </div>
                <hr />
                <div>
                  <span className="block font-semibold text-sm mb-1">Phone</span>
                  <span>
                    {settings?.companyPhone?.trim() ? (
                      settings.companyPhone
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </span>
                </div>
                <hr />
                <div>
                  <span className="block font-semibold text-sm mb-1">Address</span>
                  <span>
                    {settings?.companyAddress?.trim() ? (
                      settings.companyAddress
                    ) : (
                      <span className="text-muted-foreground">--</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogAction asChild>
                <Link to="/settings">Update Information</Link>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarFooter>
    </Sidebar>
  );
}

function TopBar() {
  const { serialStatus, latestReading } = useWeightStore();
  const { settings } = useSettingsStore();

  const signalRed =
    serialStatus === 'disconnected' ||
    serialStatus === 'error' ||
    serialStatus === 'idle' ||
    !latestReading;

  const signalYellow = serialStatus === 'connecting' || serialStatus === 'reconnecting';

  const signalLoading = serialStatus === 'reconnecting' || serialStatus === 'connecting';

  async function handleReconnect() {
    try {
      window.electronAPI.reconnectPort();
    } catch (error) {
      toast.error((error as Error).message);
      logger('error', (error as Error).message);
    }
  }

  return (
    <nav className="bg-sidebar/70 px-2 py-3 sticky top-0 w-full flex items-center justify-between z-50 backdrop-blur-lg">
      <section className="flex items-center gap-1">
        <SidebarTrigger />

        <span className="text-sm">Weight Management</span>
      </section>

      <section className="flex items-center gap-2">
        <div className="flex items-center font-light text-sm border-r pr-2 gap-0">
          <span className="flex justify-start h-full">
            {signalRed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SignalLowIcon className="text-red-700 dark:text-red-400 -mr-2" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    Connection lost or unstable. Please check the device connection or go to
                    settings and change he COM port.
                  </span>
                </TooltipContent>
              </Tooltip>
            ) : signalYellow ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SignalMediumIcon className="text-yellow-700 dark:text-yellow-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>Connecting to the device. Please wait...</span>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <SignalHighIcon className="text-green-700 dark:text-green-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <span>Connected and receiving stable readings.</span>
                </TooltipContent>
              </Tooltip>
            )}
          </span>

          <span>{settings?.serialPort}</span>
        </div>

        <div className="pr-2 border-r">
          <Badge variant={signalRed ? 'destructive' : 'outline'}>
            {signalLoading && <Loader2 />}
            {serialStatus}
          </Badge>
        </div>

        {signalRed && (
          <Button className="max-h-10" onClick={handleReconnect}>
            Reconnect
          </Button>
        )}
      </section>
    </nav>
  );
}
