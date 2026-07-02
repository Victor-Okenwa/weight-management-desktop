import { eq, isNull, or } from 'drizzle-orm';
import type { DatabaseInstance } from './index.js';
import { materials, records, vehicles } from './schema/index.js';

const INVALID_TIMESTAMP = 'CURRENT_TIMESTAMP';

export function nowIso(): string {
  return new Date().toISOString();
}

/** Backfill rows that stored the Drizzle default literal instead of a real timestamp. */
export function repairInvalidTimestamps(db: DatabaseInstance): void {
  const fallback = nowIso();

  db.update(materials)
    .set({ createdAt: fallback })
    .where(or(isNull(materials.createdAt), eq(materials.createdAt, INVALID_TIMESTAMP)))
    .run();

  db.update(vehicles)
    .set({ createdAt: fallback })
    .where(or(isNull(vehicles.createdAt), eq(vehicles.createdAt, INVALID_TIMESTAMP)))
    .run();

  db.update(records)
    .set({ createdAt: fallback, updatedAt: fallback })
    .where(or(isNull(records.createdAt), eq(records.createdAt, INVALID_TIMESTAMP)))
    .run();

  db.update(records)
    .set({ updatedAt: fallback })
    .where(or(isNull(records.updatedAt), eq(records.updatedAt, INVALID_TIMESTAMP)))
    .run();
}
