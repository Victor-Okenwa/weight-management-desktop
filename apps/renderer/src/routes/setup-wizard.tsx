import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/setup-wizard')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/setup-wizard"!</div>;
}
