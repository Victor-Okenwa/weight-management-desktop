import { createFileRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { HistoryIcon, LayoutDashboard, Link, Settings2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useWeightUpdates } from '@/hooks/use-weight-updates';

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
      return {
        redirect: '/setup-wizard',
      };
    }
  },
});

function RouteComponent() {
  useWeightUpdates(); // start listening to updates

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
      <SidebarHeader />
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
  return <nav className="bg-sidebar px-2 py-3 sticky top-0 w-full"></nav>;
}
