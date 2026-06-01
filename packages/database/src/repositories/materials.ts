import type { Material, PaginatedResult } from '@weight/shared/types/index';
import { count, eq } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { materials } from '../schema/index.js';

/**
 * Return the ID of an existing material, or create a new one and return its ID.
 */
export function getOrCreateMaterial(db: DatabaseInstance, name: string): number {
  const trimmed = name.trim();
  // Find existing
  const existing = db
    .select({ id: materials.id })
    .from(materials)
    .where(eq(materials.name, trimmed))
    .get();

  if (existing) return existing.id;

  // Insert new
  const result = db
    .insert(materials)
    .values({ name: trimmed })
    .returning({ id: materials.id })
    .get();

  return result.id;
}

/**
 * Get all materials ordered by name.
 */
export function getAllMaterials(db: DatabaseInstance): Material[] {
  return db.select().from(materials).orderBy(materials.name).all() as Material[];
}

/**
 * Get materials with pagination.
 */
export function getMaterialsPaginated(
  db: DatabaseInstance,
  page: number,
  pageSize: number,
): PaginatedResult<Material> {
  const offset = (page - 1) * pageSize;

  const data = db
    .select()
    .from(materials)
    .orderBy(materials.name)
    .limit(pageSize)
    .offset(offset)
    .all();

  const total = db.select({ count: count() }).from(materials).get()?.count ?? 0;

  return { data: data as Material[], total, page, pageSize };
}
