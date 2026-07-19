import type { WeightReading } from '@weight/shared/types/index';

/** Stability is decided by SerialManager (tolerance + duration). */
export class AveryWeightParser {
  parse(data: string, unit: string = 'kg'): WeightReading | null {
    const parts = data.split(',');
    if (parts.length !== 4) return null;
    const weight = Number.parseFloat(parts[2].trim());
    if (Number.isNaN(weight)) return null;
    const parsedUnit = parts[3].trim().toLowerCase() || unit;
    return { weight, unit: parsedUnit, raw: data, isStable: false };
  }
}
