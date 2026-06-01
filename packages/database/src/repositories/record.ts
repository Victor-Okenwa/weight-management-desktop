import type { PaginatedResult, Record } from '@weight/shared/types/index';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { records, settings, vehicles } from '../schema/index.js';
import { getOrCreateMaterial } from './materials.js';
import { getOrCreateVehicle } from './vehicles.js';

// ---------- Ticket ID generation ----------
function getNextTicketId(db: DatabaseInstance): string {
  // Read current prefix and number from settings (single row)
  const row = db
    .select({
      ticketPrefix: settings.ticketPrefix,
      nextTicketNumber: settings.nextTicketNumber,
    })
    .from(settings)
    .where(eq(settings.id, 1))
    .get();

  const prefix = row?.ticketPrefix || 'SRW';
  const number = row?.nextTicketNumber || 1;

  // Generate the ticket ID (e.g., SRW-0001)
  const ticketId = `${prefix}-${String(number).padStart(4, '0')}`;

  // Increment the counter in the database
  db.update(settings)
    .set({ nextTicketNumber: number + 1 })
    .where(eq(settings.id, 1))
    .run();

  return ticketId;
}

// ---------- Create record ----------
export interface CreateRecordInput {
  operator?: string | null;
  operationType: 'single' | 'double';
  grossWeight?: number | null;
  tareWeight?: number | null;
  netWeight?: number | null;
  status?: 'pending' | 'completed';
  vehicleName?: string | null;
  materialName?: string | null;
  remark?: string | null;
  vehicleTareWeight?: number | null; // if vehicle is new, set its tare weight
  vehicleTareUnit?: string | null;
}

export function createRecord(db: DatabaseInstance, data: CreateRecordInput): Record {
  // Upsert vehicle if name provided
  let vehicleId: number | null = null;
  if (data.vehicleName) {
    vehicleId = getOrCreateVehicle(
      db,
      data.vehicleName,
      data.vehicleTareWeight,
      data.vehicleTareUnit,
    );
  }

  // Upsert material if name provided
  let materialId: number | null = null;
  if (data.materialName) {
    materialId = getOrCreateMaterial(db, data.materialName);
  }

  const ticketId = getNextTicketId(db);

  const result = db
    .insert(records)
    .values({
      ticketId,
      operator: data.operator ?? null,
      operationType: data.operationType,
      grossWeight: data.grossWeight ?? null,
      tareWeight: data.tareWeight ?? null,
      netWeight: data.netWeight ?? null,
      status: data.status || 'pending',
      vehicleId,
      materialId,
      remark: data.remark ?? null,
    })
    .returning()
    .get();

  return result as Record;
}

// ---------- Update record ----------
export interface UpdateRecordInput {
  operator?: string | null;
  operationType?: 'single' | 'double';
  grossWeight?: number | null;
  tareWeight?: number | null;
  netWeight?: number | null;
  status?: 'pending' | 'completed';
  vehicleName?: string | null;
  materialName?: string | null;
  remark?: string | null;
  vehicleTareWeight?: number | null;
  vehicleTareUnit?: string | null;
  vehicleId?: number | null;
  materialId?: number | null;
  updatedAt?: string;
}

export function updateRecord(
  db: DatabaseInstance,
  id: number,
  data: UpdateRecordInput,
): Record | null {
  // Upsert vehicle if a new name is provided
  let vehicleId: number | undefined;
  if (data.vehicleName) {
    vehicleId = getOrCreateVehicle(
      db,
      data.vehicleName,
      data.vehicleTareWeight,
      data.vehicleTareUnit,
    );
  }

  // Upsert material if a new name is provided
  let materialId: number | undefined;
  if (data.materialName) {
    materialId = getOrCreateMaterial(db, data.materialName);
  }

  const updateData: UpdateRecordInput = { ...data };
  // Remove the names, keep only IDs
  delete updateData.vehicleName;
  delete updateData.materialName;
  delete updateData.vehicleTareWeight;

  if (vehicleId !== undefined) updateData.vehicleId = vehicleId;
  if (materialId !== undefined) updateData.materialId = materialId;

  // Set updated_at to now
  updateData.updatedAt = new Date().toISOString();

  const result = db.update(records).set(updateData).where(eq(records.id, id)).returning().get();

  return result as Record;
}

// ---------- Get single record ----------
export function getRecordById(db: DatabaseInstance, id: number): Record | null {
  const result = db.select().from(records).where(eq(records.id, id)).get() ?? null;
  return result as Record;
}

// ---------- Paginated list with optional filters ----------
export interface RecordFilters {
  status?: 'pending' | 'completed';
  vehicleName?: string;
  startDate?: string; // ISO date strings
  endDate?: string;
}

export function getRecordsPaginated(
  db: DatabaseInstance,
  page: number,
  pageSize: number,
  filters?: RecordFilters,
): PaginatedResult<Record> {
  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (filters?.status) {
    conditions.push(eq(records.status, filters.status));
  }
  if (filters?.vehicleName) {
    // Join with vehicles table to filter by name
    // For simplicity, we'll filter by exact name (could be like)
    const vehicle = db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.name, filters.vehicleName))
      .get();
    if (vehicle) {
      conditions.push(eq(records.vehicleId, vehicle.id));
    } else {
      // No matching vehicle → return empty
      return { data: [], total: 0, page, pageSize };
    }
  }
  if (filters?.startDate) {
    conditions.push(sql`${records.createdAt} >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`${records.createdAt} <= ${filters.endDate}`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const data = db
    .select()
    .from(records)
    .where(whereClause)
    .orderBy(desc(records.createdAt)) // newest first
    .limit(pageSize)
    .offset(offset)
    .all();

  const total = db.select({ count: count() }).from(records).where(whereClause).get()?.count ?? 0;

  return { data: data as Record[], total, page, pageSize };
}
