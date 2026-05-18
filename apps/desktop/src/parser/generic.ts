import type { WeightReading } from '@weight/shared/types/index';
import type { IWeightParser } from './index.js';

/**
 * Generic fallback parser.
 * Attempts to extract: number + optional unit string
 * Example: "  2450 kg" → weight: 2450, unit: "kg"
 */
export class GenericWeightParser implements IWeightParser {
  private lastWeight: number | null = null;

  parse(data: string, unit: string = 'kg'): WeightReading | null {
    const trimmed = data.trim();
    // Match: number (with optional decimal), followed by optional spaces and a unit word
    const match = trimmed.match(/^(-?\d+\.?\d*)\s*(.*)$/);
    if (!match) return null;

    const weight = Number.parseFloat(match[1]);
    const parsedUnit = match[2].trim() || unit;

    const isStable = this.lastWeight !== null && weight === this.lastWeight;
    this.lastWeight = weight;

    return {
      weight,
      unit: parsedUnit.toLowerCase(),
      raw: data,
      isStable,
    };
  }
}
