import { WeightReading } from "@weight/shared/types/index";

export class AveryWeightParser {
  private lastWeight: number | null = null;

  parse(data: string, unit: string = 'kg'): WeightReading | null {
    const parts = data.split(',');
    if (parts.length !== 4) return null;
    const weight = Number.parseFloat(parts[2].trim());
    if (Number.isNaN(weight)) return null;
    const parsedUnit = parts[3].trim().toLowerCase() || unit;
    const isStable = this.lastWeight !== null && weight === this.lastWeight;
    this.lastWeight = weight;
    return { weight, unit: parsedUnit, raw: data, isStable };
  }
}