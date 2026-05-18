import { createFileRoute } from '@tanstack/react-router';
import { WeightDisplay } from '@/components/weight-display';

export const Route = createFileRoute('/_protected/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <WeightDisplay />
    </div>
  );
}
