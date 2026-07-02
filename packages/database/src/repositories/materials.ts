import type { Material, PaginatedResult } from '@weight/shared/types/index';
import { count, eq, inArray, sql } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { materials } from '../schema/index.js';

export function getOrCreateMaterial(db: DatabaseInstance, name: string): number {
  const trimmed = name.trim();
  const existing = db
    .select({ id: materials.id })
    .from(materials)
    .where(eq(materials.name, trimmed))
    .get();

  if (existing) return existing.id;

  const result = db
    .insert(materials)
    .values({ name: trimmed })
    .returning({ id: materials.id })
    .get();

  return result.id;
}

export function getAllMaterials(db: DatabaseInstance): Material[] {
  return db.select().from(materials).orderBy(materials.name).all() as Material[];
}

export function getMaterialsPaginated(
  db: DatabaseInstance,
  page: number,
  pageSize: number,
  filters?: { search?: string },
): PaginatedResult<Material> {
  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (filters?.search) {
    conditions.push(sql`${materials.name} LIKE ${`%${filters.search}%`}`);
  }

  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

  const data = db
    .select()
    .from(materials)
    .where(whereClause)
    .orderBy(materials.name)
    .limit(pageSize)
    .offset(offset)
    .all();

  const total = db.select({ count: count() }).from(materials).where(whereClause).get()?.count ?? 0;

  return { data: data as Material[], total, page, pageSize };
}

export function updateMaterial(
  db: DatabaseInstance,
  id: number,
  data: { name?: string },
): Material | null {
  if (data.name) {
    const trimmed = data.name.trim();
    const existing = db
      .select({ id: materials.id })
      .from(materials)
      .where(eq(materials.name, trimmed))
      .get();
    if (existing && existing.id !== id) {
      return null;
    }
    data.name = trimmed;
  }

  const result = db.update(materials).set(data).where(eq(materials.id, id)).returning().get();

  return result as Material;
}

export function deleteMaterial(db: DatabaseInstance, id: number): void {
  db.delete(materials).where(eq(materials.id, id)).run();
}

export function deleteMaterials(db: DatabaseInstance, ids: number[]): number {
  if (ids.length === 0) return 0;
  const result = db.delete(materials).where(inArray(materials.id, ids)).returning().all();
  return result.length;
}
