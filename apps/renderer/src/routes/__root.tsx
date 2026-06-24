import { createRootRoute, Outlet } from '@tanstack/react-router';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';

export const Route = createRootRoute({
  component: () => {
    const [healthResult, setHealthResult] = useState<{ ok: boolean } | null>(null);

    const runDbHealth = async () => {
      const result = await window.electronAPI.checkDatabaseHealth();
      if (result?.tables) {
        Object.entries(result.tables).forEach(([tableName, tableData]) => {
          console.table(
            tableData.sample,
            undefined,
            `Table: ${tableName} (Count: ${tableData.count})`,
          );
        });
      }

      setHealthResult(result);
    };

    return (
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Outlet />
          <Toaster closeButton={true} duration={5000} position="top-center" richColors />
          {/* REMOVE FOR PRODUCTION */}
          <div className="fixed bottom-4 right-4 z-50">
            <button
              type="button"
              onClick={runDbHealth}
              className="rounded bg-blue-500 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-600"
            >
              {healthResult === null ? 'DB Health' : healthResult.ok ? '✓ Healthy' : '✗ Error'}
            </button>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    );
  },
});
