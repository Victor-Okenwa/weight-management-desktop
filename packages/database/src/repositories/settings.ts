// packages/database/src/repositories/settingsRepository.ts
import { eq } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { settings } from '../schema/index.js';

// Get the full settings row (all columns) – returns undefined if not initialised
export function getAllSettings(db: DatabaseInstance) {
  return db.select().from(settings).where(eq(settings.id, 1)).get();
}

// Update one or more fields using a partial object
export function updateSettings(db: DatabaseInstance, data: Partial<typeof settings.$inferInsert>) {
  // Ensure we never change the id
  const { id, ...rest } = data;
  if (Object.keys(rest).length === 0) return;

  // Check if row exists
  const existing = db.select({ id: settings.id }).from(settings).where(eq(settings.id, 1)).get();
  if (existing) {
    db.update(settings).set(rest).where(eq(settings.id, 1)).run();
  } else {
    // Insert first row
    db.insert(settings)
      .values({ id: 1, ...rest })
      .run();
  }
}
