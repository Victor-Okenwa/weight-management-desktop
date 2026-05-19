import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ---------- Settings ----------
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull().default(''),
});

// ---------- Vehicles ----------
export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// ---------- Materials ----------
export const materials = sqliteTable('materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// ---------- Records (weighing transactions) ----------
export const records = sqliteTable('records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticketId: text('ticket_id').notNull().unique(),
  operator: text('operator'),
  operationType: text('operation_type', { enum: ['single', 'double'] })
    .notNull()
    .default('single'),
  grossWeight: real('gross_weight'),
  tareWeight: real('tare_weight'),
  netWeight: real('net_weight'),
  status: text('status', { enum: ['pending', 'completed'] })
    .notNull()
    .default('pending'),
  vehicleId: integer('vehicle_id').references(() => vehicles.id),
  materialId: integer('material_id').references(() => materials.id),
  remark: text('remark'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
});
