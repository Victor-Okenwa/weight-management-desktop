import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Route = createRootRoute({
  component: () => (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Outlet />
        <Toaster closeButton={true} duration={5000} position="top-center" richColors />
      </TooltipProvider>
    </ThemeProvider>
  ),
});
