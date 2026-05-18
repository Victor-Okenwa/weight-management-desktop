import { TooltipProvider } from '@/components/ui/tooltip';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <Outlet />
      <Toaster closeButton={true} duration={5000} position="top-center" richColors />
    </TooltipProvider>
  ),
});
