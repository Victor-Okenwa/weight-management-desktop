import { HardDriveIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';
import { useWeightStore } from '@/store/weightStore';
import { Spinner } from './ui/spinner';

export function WeightDisplay() {
  const { latestReading, serialStatus } = useWeightStore();
  const { settings } = useSettingsStore();

  const retrying = serialStatus === 'connecting' || serialStatus === 'reconnecting';

  const trafficRed =
    serialStatus === 'disconnected' ||
    serialStatus === 'error' ||
    serialStatus === 'idle' ||
    serialStatus === 'reconnecting';

  const trafficYellow =
    serialStatus === 'connecting' || serialStatus === 'reconnecting' || !latestReading?.isStable;

  const trafficGreen = serialStatus === 'connected' && latestReading?.isStable;

  console.log(serialStatus);

  return (
    <div className="rounded-lg relative overflow-hidden shadow dark:shadow-2xl dark:shadow-white/5">
      <header className="bg-black/90 flex justify-end py-3 px-2">
        <div className="flex items-center gap-2">
          {retrying && <Spinner className="text-white" />}

          {/* Traffic light container */}
          <div className="flex flex-row justify-between items-center h-6 w-16 bg-black rounded-full p-1 shadow-inner border border-gray-700">
            {/* Red Light */}
            <span
              className={cn(
                'block h-4 w-4 rounded-full mr-1 transition-all duration-200',
                trafficRed ? 'bg-red-500 shadow-lg shadow-red-500/60' : 'bg-red-700 opacity-40',
              )}
            ></span>
            {/* Yellow Light */}
            <span
              className={cn(
                'block h-4 w-4 rounded-full mr-1 transition-all duration-200',
                trafficYellow
                  ? 'bg-yellow-300 shadow-lg shadow-yellow-300/60'
                  : 'bg-yellow-600 opacity-40',
              )}
            ></span>
            {/* Green Light */}
            <span
              className={cn(
                'block h-4 w-4 rounded-full transition-all duration-200',
                trafficGreen
                  ? 'bg-green-500 shadow-lg shadow-green-500/60'
                  : 'bg-green-700 opacity-40',
              )}
            ></span>
          </div>
        </div>
      </header>

      <div className="relative bg-black px-2 py-4 flex justify-end items-center min-h-52">
        <div
          aria-hidden
          className="font-classic absolute inset-0 select-none flex justify-end items-center text-[4rem] text-red-700 opacity-20 px-2"
        >
          888888 <sub></sub>
        </div>
        <div
          className="relative font-classic tabular-nums text-[4rem] text-red-600"
          style={{
            textShadow: `
             0 0 8px #ff1744, 
             0 0 20px #ff1744, 
             0 0 36px #ff1744, 
             0 0 60px #ff1744,
             0 0 4px #fff1,
             0 0 1px #fff4
           `,
          }}
        >
          {latestReading?.weight ?? <span className="opacity-20">------</span>}
        </div>
      </div>

      <footer className="px-2 py-3 bg-black/90 flex justify-between items-center text-white">
        <section className="flex items-center gap-2 uppercase">
          <HardDriveIcon className="text-red-700 dark:text-red-400" /> {settings?.indicatorType}
        </section>

        <section>Unit: {settings?.weightUnit}</section>
      </footer>
    </div>
  );
}
