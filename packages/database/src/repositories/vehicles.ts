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
  tareUnit?: string | null,
): number {
  const trimmed = name.trim();
  const existing = db
    .select({ id: vehicles.id, tareWeight: vehicles.tareWeight, tareUnit: vehicles.tareUnit })
    .from(vehicles)
    .where(eq(vehicles.name, trimmed))
    .get();

  if (existing) {
    console.log('[getOrCreateVehicle] Found existing vehicle:', existing);

    // Update tareWeight and tareUnit if they're different from what's stored (null-safe).
    const shouldUpdateTareWeight =
      typeof tareWeight !== 'undefined' && (existing.tareWeight ?? null) !== (tareWeight ?? null);
    const shouldUpdateTareUnit =
      typeof tareUnit !== 'undefined' && (existing.tareUnit ?? null) !== (tareUnit ?? null);

    console.log(
      '[getOrCreateVehicle] shouldUpdateTareWeight:',
      shouldUpdateTareWeight,
      'shouldUpdateTareUnit:',
      shouldUpdateTareUnit,
    );

    if (shouldUpdateTareWeight || shouldUpdateTareUnit) {
      const updateData: Partial<typeof vehicles.$inferInsert> = {};
      if (shouldUpdateTareWeight) updateData.tareWeight = tareWeight ?? null;
      if (shouldUpdateTareUnit) updateData.tareUnit = tareUnit ?? null;
      console.log('[getOrCreateVehicle] Updating vehicle ID', existing.id, 'with', updateData);
      db.update(vehicles).set(updateData).where(eq(vehicles.id, existing.id)).run();
    }
    return existing.id;
  }

  const result = db
    .insert(vehicles)
    .values({
      name: trimmed,
      tareWeight: tareWeight ?? null,
      tareUnit: tareUnit ?? null,
    })
    .returning({ id: vehicles.id })
    .get();

  console.log('[getOrCreateVehicle] Inserted new vehicle with ID:', result.id);

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

export function updateVehicleTare(
  db: DatabaseInstance,
  vehicleId: number,
  tareWeight: number,
  tareUnit?: string | null,
): void {
  const data: Partial<typeof vehicles.$inferInsert> = { tareWeight };
  if (tareUnit !== undefined) {
    data.tareUnit = tareUnit;
  }
  db.update(vehicles).set(data).where(eq(vehicles.id, vehicleId)).run();
}
