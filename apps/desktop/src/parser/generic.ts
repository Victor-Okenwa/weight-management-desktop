import type { WeightReading } from '@weight/shared/types/index';

/**
 * Generic fallback parser.
 * Attempts to extract: number + optional unit string
 * Example: "  2450 kg" → weight: 2450, unit: "kg"
 * Stability is decided by SerialManager (tolerance + duration).
 */
export class GenericWeightParser {
  parse(data: string, unit: string = 'kg'): WeightReading | null {
    const trimmed = data.trim();
    // Match: number (with optional decimal), followed by optional spaces and a unit word
    const match = trimmed.match(/^(-?\d+\.?\d*)\s*(.*)$/);
    if (!match) return null;

    const weight = Number.parseFloat(match[1]);
    const parsedUnit = match[2].trim() || unit;

    return {
      weight,
      unit: parsedUnit.toLowerCase(),
      raw: data,
      isStable: false,
    };
  }
}
