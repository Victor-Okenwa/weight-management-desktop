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
import { WeightDisplay } from '@/components/weight-display';
import { useWeightUpdates } from '../../hooks/use-weight-updates';
import { useWeightStore } from '../../store/weightStore';

const dashboardRoutes = [
  {
    icon: LayoutDashboard,
    link: '/dashboard',
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

export const Route = createFileRoute('/_protected/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar />

      <main className="w-full">
        <TopBar />
        <WeightDisplay />
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
