import type { PaginatedResult, Vehicle } from '@weight/shared/types/index';
import { count, eq, inArray, sql } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { vehicles } from '../schema/index.js';

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
    const shouldUpdateTareWeight =
      typeof tareWeight !== 'undefined' && (existing.tareWeight ?? null) !== (tareWeight ?? null);
    const shouldUpdateTareUnit =
      typeof tareUnit !== 'undefined' && (existing.tareUnit ?? null) !== (tareUnit ?? null);

    if (shouldUpdateTareWeight || shouldUpdateTareUnit) {
      const updateData: Partial<typeof vehicles.$inferInsert> = {};
      if (shouldUpdateTareWeight) updateData.tareWeight = tareWeight ?? null;
      if (shouldUpdateTareUnit) updateData.tareUnit = tareUnit ?? null;
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

  return result.id;
}

export function getAllVehicles(db: DatabaseInstance): Vehicle[] {
  return db.select().from(vehicles).orderBy(vehicles.name).all() as Vehicle[];
}

export function getVehiclesPaginated(
  db: DatabaseInstance,
  page: number,
  pageSize: number,
  filters?: { search?: string },
): PaginatedResult<Vehicle> {
  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (filters?.search) {
    conditions.push(sql`${vehicles.name} LIKE ${`%${filters.search}%`}`);
  }

  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

  const data = db
    .select()
    .from(vehicles)
    .where(whereClause)
    .orderBy(vehicles.name)
    .limit(pageSize)
    .offset(offset)
    .all();

  const total = db.select({ count: count() }).from(vehicles).where(whereClause).get()?.count ?? 0;

  return { data: data as Vehicle[], total, page, pageSize };
}

export function updateVehicle(
  db: DatabaseInstance,
  id: number,
  data: { name?: string; tareWeight?: number | null; tareUnit?: string | null },
): Vehicle | null {
  if (data.name) {
    const trimmed = data.name.trim();
    const existing = db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.name, trimmed))
      .get();
    if (existing && existing.id !== id) {
      return null;
    }
    data.name = trimmed;
  }

  const result = db
    .update(vehicles)
    .set({ ...data })
    .where(eq(vehicles.id, id))
    .returning()
    .get();

  return result as Vehicle;
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

export function deleteVehicle(db: DatabaseInstance, id: number): void {
  db.delete(vehicles).where(eq(vehicles.id, id)).run();
}

export function deleteVehicles(db: DatabaseInstance, ids: number[]): number {
  if (ids.length === 0) return 0;
  const result = db.delete(vehicles).where(inArray(vehicles.id, ids)).returning().all();
  return result.length;
}
