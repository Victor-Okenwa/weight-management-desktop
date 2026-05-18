import { DotIcon } from 'lucide-react';
import { useWeightUpdates } from '@/hooks/use-weight-updates';
import { useWeightStore } from '@/store/weightStore';

export function WeightDisplay() {
  useWeightUpdates(); // starts listening

  const latestReading = useWeightStore((s) => s.latestReading);
  return (
    <div className="rounded-lg relative overflow-hidden shadow">
      <header className="bg-background flex justify-end py-3 px-2">
        {latestReading?.isStable && (
          <div className="flex">
            <DotIcon className="text-green-600 size-6" />{' '}
            <span className="text-green-600">Stable</span>
          </div>
        )}
      </header>
      <div className="relative bg-black">
        <div aria-hidden className="font-digital text-display-dim/40 absolute inset-0 select-none">
          888888
        </div>
        <div className=" relative tabular-nums">{latestReading?.weight}</div>
      </div>
      <footer></footer>
    </div>
  );
}
