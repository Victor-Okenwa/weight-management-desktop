import { WeightReading } from '@weight/shared/types/index';
import { IWeightParser } from './index.js';

/**
 * Parses weight strings from a Cardinal 225 indicator.
 * Expected format: "  102.5 lb" or "  0.00 kg"
 * (optional sign, digits, optional decimal, spaces, unit letters)
 */
export class Cardinal225WeightParser implements IWeightParser {
  private lastWeight: number | null = null;

  parse(data: string, unit: string = 'kg'): WeightReading | null {
    const match = data.trim().match(/^(-?\d+\.?\d*)\s*(\w+)$/);
    if (!match) return null;

    const weight = Number.parseFloat(match[1]);
    const parsedUnit = match[2].toLowerCase() || unit;
    const isStable = this.lastWeight !== null && weight === this.lastWeight;

    this.lastWeight = weight;

    return {
      weight,
      unit: parsedUnit,
      raw: data,
      isStable,
    };
  }
}
