import type { WeightReading } from '@weight/shared/types/index';

export class StableWeightDetector {
  private buffer: { reading: WeightReading; timestamp: number }[] = [];
  private readonly tolerance: number;   // weight difference considered “same”
  private readonly stableDuration: number; // in milliseconds
  private lastStableWeight: number | null = null;
  private onStable: (reading: WeightReading) => void;

  constructor(
    onStable: (reading: WeightReading) => void,
    tolerance = 0.5,          // 0.5 kg default
    stableDuration = 3000     // 3 seconds
  ) {
    this.onStable = onStable;
    this.tolerance = tolerance;
    this.stableDuration = stableDuration;
  }

  // Call this for every new reading from the serial stream
  addReading(reading: WeightReading) {
    const now = Date.now();

    // Add to buffer
    this.buffer.push({ reading, timestamp: now });

    // Remove old entries beyond stableDuration
    const cutoff = now - this.stableDuration;
    this.buffer = this.buffer.filter((entry) => entry.timestamp > cutoff);

    // Check if all readings in the buffer are the same (within tolerance)
    if (this.buffer.length < 2) return; // need at least a couple of readings to judge stability

    const firstWeight = this.buffer[0].reading.weight;
    const allStable = this.buffer.every(
      (entry) => Math.abs(entry.reading.weight - firstWeight) <= this.tolerance
    );

    if (allStable) {
      // If we haven't already emitted a stable reading for this weight
      if (this.lastStableWeight !== firstWeight) {
        const stableReading: WeightReading = {
          ...reading,
          isStable: true,
        };
        this.onStable(stableReading);
        this.lastStableWeight = firstWeight;
        // Clear buffer to avoid re-emitting the same stable value
        this.buffer = [];
      }
    }
  }
}