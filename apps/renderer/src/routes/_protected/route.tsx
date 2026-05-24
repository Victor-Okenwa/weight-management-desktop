import { createFileRoute, Link, Outlet, redirect, useRouterState } from '@tanstack/react-router';
import {
  HistoryIcon,
  LayoutDashboard,
  Settings2,
  SignalHighIcon,
  SignalLowIcon,
  SignalMediumIcon,
} from 'lucide-react';
import { useEffect } from 'react';
import { NotFound } from '@/components/not-found';
import { type Theme, useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
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
import { useSettingsStore } from '@/store/settingsStore';
import { useWeightStore } from '@/store/weightStore';

const sidebarRoutes = [
  {
    icon: LayoutDashboard,
    link: '/',
    label: 'Dashboard',
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

    const setupCompleted = await window.electronAPI.isSetupCompleted();

    if (!setupCompleted) {
      // Redirect to setup-wizard if setup is NOT completed
      window.electronAPI.log('info', 'App not connected');

      throw redirect({
        to: '/setup-wizard',
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
      <AppSidebar />

      <main className="w-full">
        <TopBar />
        <Outlet />
      </main>
    </SidebarProvider>
  );
}

function AppSidebar() {
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
      <SidebarFooter />
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
    serialStatus === 'reconnecting' ||
    !latestReading;

  const signalYellow = serialStatus === 'connecting' || serialStatus === 'reconnecting';

  // console.log(serialStatus);

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

        <div>
          <Badge>{serialStatus}</Badge>
        </div>
      </section>
    </nav>
  );
}
