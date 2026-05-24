import { createFileRoute } from '@tanstack/react-router';
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
        </TabsList>
        <TabsContent value="serial">
          <SerialConfigurationsTab />
        </TabsContent>
        <TabsContent value="preferences">Change your preferences here.</TabsContent>
        <TabsContent value="company">Company Details.</TabsContent>
      </Tabs>
    </article>
  );
}
