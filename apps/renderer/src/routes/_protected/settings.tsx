/* eslint-disable react-refresh/only-export-components */
import { createFileRoute } from '@tanstack/react-router';
import { CompanyDetailsTab } from '@/components/company-details-tab';
import { PreferencesTab } from '@/components/preferences-tab';
import { SecurityTab } from '@/components/security-tab';
import { SerialConfigurationsTab } from '@/components/serial-configurations-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Route = createFileRoute('/_protected/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <article className="py-3 px-2">
      <Tabs defaultValue="serial" className="w-full flex flex-col">
        <TabsList>
          <TabsTrigger value="serial">Serial</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="company">Company Details</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="serial">
          <SerialConfigurationsTab />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>

        <TabsContent value="company">
          <CompanyDetailsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
      </Tabs>
    </article>
  );
}
