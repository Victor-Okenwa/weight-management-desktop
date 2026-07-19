import type { WeightReading } from '@weight/shared/types/index';

/**
 * Parses weight strings from a Cardinal 225 indicator.
 * Expected format: "  102.5 lb" or "  0.00 kg"
 * Stability is decided by SerialManager (tolerance + duration).
 */
export class Cardinal225WeightParser {
  parse(data: string, unit: string = 'kg'): WeightReading | null {
    const match = data.trim().match(/^(-?\d+\.?\d*)\s*(\w+)$/);
    if (!match) return null;

    const weight = Number.parseFloat(match[1]);
    const parsedUnit = match[2].toLowerCase() || unit;

    return {
      weight,
      unit: parsedUnit,
      raw: data,
      isStable: false,
    };
  }
}
