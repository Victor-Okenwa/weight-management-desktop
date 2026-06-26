/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router';
import { CableIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeightDisplay } from '@/components/weight-display';
import { useSettingsStore } from '@/store/settingsStore';

export const Route = createFileRoute('/_protected/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { settings } = useSettingsStore();
  return (
    <article className="px-4 py-5 space-y-5">
      <section>
        <WeightDisplay />
      </section>

      <section className="">
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex gap-2">
              <CableIcon /> Connection Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="pb-4 border-b flex justify-between items-center px-4">
              <strong>Serial Port:</strong>

              <p>{settings?.serialPort}</p>
            </div>

            <div className="py-4 border-b flex justify-between items-center px-4">
              <strong>Baud Rate:</strong>

              <p>{settings?.baudRate}</p>
            </div>

            <div className="py-4 border-b flex justify-between items-center px-4">
              <strong>Parity:</strong>

              <p>{settings?.parity}</p>
            </div>

            <div className="py-4 border-b flex justify-between items-center px-4">
              <strong>Data bits:</strong>

              <p>{settings?.dataBits}</p>
            </div>

            <div className="py-4 border-b flex justify-between items-center px-4">
              <strong>Stop Bits:</strong>

              <p>{settings?.stopBits}</p>
            </div>

            <div className="pt-4 flex justify-between items-center px-4">
              <strong>Flow Control:</strong>

              <p>{settings?.flowControl}</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </article>
  );
}
