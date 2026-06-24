import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WeightDisplay } from '@/components/weight-display';
import { useWeightStore } from '@/store/weightStore';

export function WeightCaptureArea({
  label,
  capturedWeight,
  onCapture,
  onRecapture,
  canCapture,
  weightUnit,
  existingTare,
}: {
  label: string;
  capturedWeight: number | null;
  onCapture: () => void;
  onRecapture?: () => void;
  canCapture: boolean;
  weightUnit: string;
  existingTare?: { weight: number; unit: string } | null;
}) {
  const { serialStatus } = useWeightStore();
  const isConnected = serialStatus === 'connected';

  return (
    <div className="space-y-4">
      {existingTare ? (
        <div className="rounded-lg border p-5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">
            {existingTare.weight} {existingTare.unit}
          </p>
          <p className="text-xs text-muted-foreground">Using stored vehicle tare</p>
        </div>
      ) : capturedWeight != null ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2">
              {onRecapture && (
                <Button type="button" variant="outline" size="sm" onClick={onRecapture}>
                  Recapture
                </Button>
              )}
              <Check className="size-5 text-green-500" />
            </div>
          </div>
          <p className="mt-1 text-3xl font-bold">
            {capturedWeight} {weightUnit}
          </p>
          <p className="text-xs text-green-500">Captured</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="max-w-md">
            <WeightDisplay />
          </div>
          <Button
            type="button"
            size="lg"
            onClick={onCapture}
            disabled={!canCapture || !isConnected}
            className="w-full sm:w-auto"
          >
            {!isConnected
              ? 'Scale not connected'
              : canCapture
                ? `Capture ${label}`
                : 'Waiting for stable weight...'}
          </Button>
          {!canCapture && (
            <p className="text-xs text-muted-foreground">
              Ensure the scale is connected and the reading is stable
            </p>
          )}

          {/* Display a helpful description if the scale is not connected */}
          {!isConnected && (
            <p className="text-xs text-destructive">
              Scale is not connected. Please check the connection in order to capture weight.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
