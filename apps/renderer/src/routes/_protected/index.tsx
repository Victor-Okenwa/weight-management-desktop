import { SidebarProvider } from "@/components/ui/sidebar";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { HistoryIcon, LayoutDashboard, Settings2 } from "lucide-react";
import {useWeightUpdates} from "@/hooks/useWeightUpdates"
import { useWeightStore } from "../../store/weightStore";

const dashboardRoutes = [
    {
        icon: LayoutDashboard,
        link: "/dashboard",
        label: "Dashboard"
    },
    {
        icon: HistoryIcon,
        link: "/history",
        label: "History"
    },
    {
        icon: Settings2,
        link: "/settings",
        label: "Settings"
    },
]

export const Route = createFileRoute("/_protected/")({
	component: RouteComponent,
});

function RouteComponent() {
	  useWeightUpdates(); // starts listening

  const latestReading = useWeightStore((s) => s.latestReading);

	return (
		<SidebarProvider>
			<AppSidebar />

			<main className="w-full">
				<TopBar />

                <span className="font-classic text-5xl">{latestReading?.weight}</span>
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
