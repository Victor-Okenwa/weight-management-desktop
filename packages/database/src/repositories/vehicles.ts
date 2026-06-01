import type { PaginatedResult, Vehicle } from '@weight/shared/types/index';
import { count, eq } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { vehicles } from '../schema/index.js';

/**
 * Return the ID of an existing vehicle (matched by name), or create a new one and return its ID.
 * If the vehicle already exists, the provided tareWeight is ignored (existing value is kept).
 */
export function getOrCreateVehicle(
  db: DatabaseInstance,
  name: string,
  tareWeight?: number | null,
): number {
  const trimmed = name.trim();
  // Find existing
  const existing = db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(eq(vehicles.name, trimmed))
    .get();

  if (existing) return existing.id;

  // Insert new
  const result = db
    .insert(vehicles)
    .values({
      name: trimmed,
      tareWeight: tareWeight ?? null,
    })
    .returning({ id: vehicles.id })
    .get();

  return result.id;
}

/**
 * Get all vehicles ordered by name.
 */
export function getAllVehicles(db: DatabaseInstance): Vehicle[] {
  return db.select().from(vehicles).orderBy(vehicles.name).all() as Vehicle[];
}

/**
 * Get vehicles with pagination.
 */
export function getVehiclesPaginated(
  db: DatabaseInstance,
  page: number,
  pageSize: number,
): PaginatedResult<Vehicle> {
  const offset = (page - 1) * pageSize;

  const data = db
    .select()
    .from(vehicles)
    .orderBy(vehicles.name)
    .limit(pageSize)
    .offset(offset)
    .all();

  const total = db.select({ count: count() }).from(vehicles).get()?.count ?? 0;

  return { data: data as Vehicle[], total, page, pageSize };
}
