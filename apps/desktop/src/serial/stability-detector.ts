/**
 * Determines when a live weight reading is "stable" using a tolerance band
 * and a minimum settled duration (from settings).
 */
export class StabilityDetector {
  private tolerance: number;
  private durationMs: number;
  private anchor: number | null = null;
  private stableSinceMs: number | null = null;

  constructor(tolerance = 0.5, durationMs = 3000) {
    this.tolerance = Math.max(0, tolerance);
    this.durationMs = Math.max(0, durationMs);
  }

  setConfig(tolerance: number, durationMs: number): void {
    this.tolerance = Math.max(0, tolerance);
    this.durationMs = Math.max(0, durationMs);
    this.reset();
  }

  reset(): void {
    this.anchor = null;
    this.stableSinceMs = null;
  }

  /**
   * Returns true once readings have stayed within `tolerance` of the anchor
   * weight for at least `durationMs`.
   */
  evaluate(weight: number, nowMs = Date.now()): boolean {
    if (this.anchor === null || Math.abs(weight - this.anchor) > this.tolerance) {
      this.anchor = weight;
      this.stableSinceMs = nowMs;
      return false;
    }

    if (this.stableSinceMs === null) {
      this.stableSinceMs = nowMs;
      return false;
    }

    return nowMs - this.stableSinceMs >= this.durationMs;
  }
}
