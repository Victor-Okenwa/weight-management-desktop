// packages/database/src/repositories/settingsRepository.ts
import { eq } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { settings } from '../schema/index.js';

// Get a single setting by key
export function getSetting(db: DatabaseInstance, key: string): string | undefined {
  const row = db.select().from(settings).where(eq(settings.key, key)).get();
  return row?.value;
}

// Get all settings as a key‑value object
export function getAllSettings(db: DatabaseInstance): Record<string, string> {
  const rows = db.select().from(settings).all();
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

// Upsert a single setting (insert or update)
export function setSetting(db: DatabaseInstance, key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value },
    })
    .run();
}
