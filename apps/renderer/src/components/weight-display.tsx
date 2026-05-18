import { cn } from '@/lib/utils';
import { useWeightStore } from '@/store/weightStore';

export function WeightDisplay() {
  const { latestReading, serialStatus } = useWeightStore();
  const isConnected = serialStatus === 'connected';

  return (
    <div className="rounded-lg relative overflow-hidden shadow">
      <header className="bg-accent flex justify-end py-3 px-2">
        <div className="flex items-center gap-2">
          {/* Traffic light container */}
          <div className="flex flex-row justify-between items-center h-6 w-16 bg-black rounded-full p-1 shadow-inner border border-gray-700">
            {/* Red Light */}
            <span
              className={cn(
                'block h-4 w-4 rounded-full mr-1 transition-all duration-200',
                !isConnected ? 'bg-red-500 shadow-lg shadow-red-500/60' : 'bg-red-700 opacity-40',
              )}
            ></span>
            {/* Yellow Light */}
            <span
              className={cn(
                'block h-4 w-4 rounded-full mr-1 transition-all duration-200',
                latestReading && !latestReading.isStable
                  ? 'bg-yellow-300 shadow-lg shadow-yellow-300/60'
                  : 'bg-yellow-600 opacity-40',
              )}
            ></span>
            {/* Green Light */}
            <span
              className={cn(
                'block h-4 w-4 rounded-full transition-all duration-200',
                latestReading?.isStable
                  ? 'bg-green-500 shadow-lg shadow-green-500/60'
                  : 'bg-green-700 opacity-40',
              )}
            ></span>
          </div>

          {/* <span className="ml-2 text-xs text-muted-foreground font-mono select-none tracking-tight">
            {latestReading ? (latestReading.isStable ? 'Stable' : 'Unstable') : 'No Data'}
          </span> */}
        </div>
      </header>

      <div className="relative bg-black px-2 py-4 flex justify-end items-center min-h-52">
        <div
          aria-hidden
          className="font-classic absolute inset-0 select-none flex justify-end items-center text-[4rem] text-red-700 opacity-20 px-2"
        >
          888888
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

      <footer className="px-2 py-3 bg-accent"></footer>
    </div>
  );
}
