/* eslint-disable react-refresh/only-export-components */

import { createFileRoute, Outlet } from '@tanstack/react-router';
import { HistoryIcon, LayoutDashboard, Settings2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { useWeightUpdates } from '@/hooks/use-weight-updates';

const dashboardRoutes = [
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
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

function TopBar() {
  return <nav className="bg-sidebar px-2 py-3 sticky top-0 w-full"></nav>;
}
