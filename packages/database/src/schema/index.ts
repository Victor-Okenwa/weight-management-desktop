import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

// ---------- Settings ----------
export const settings = sqliteTable('settings', {
  id: integer('id').primaryKey().default(1), // always 1 – ensures single row
  companyName: text('company_name').notNull().default(''),
  companyAddress: text('company_address').notNull().default(''),
  companyEmail: text('company_email').notNull().default(''),
  companyPhone: text('company_phone').notNull().default(''),
  companyLogoPath: text('company_logo_path').notNull().default(''),
  ticketPrefix: text('ticket_prefix').notNull().default('SRW'),
  ticketFooter: text('ticket_footer').notNull().default('Thank you for your custom'),
  nextTicketNumber: integer('next_ticket_number').notNull().default(1),
  serialPort: text('serial_port').notNull().default('COM1'),
  baudRate: integer('baud_rate').notNull().default(2400),
  dataBits: integer('data_bits').notNull().default(8),
  parity: text('parity').notNull().default('none'),
  flowControl: text('flow_control').notNull().default('none'),
  stopBits: integer('stop_bits').notNull().default(1),
  autoOpen: integer('auto_open', { mode: 'boolean' }).notNull().default(false),
  indicatorType: text('indicator_type').notNull().default('d300'),
  weightUnit: text('weight_unit').notNull().default('kg'),
  stableTolerance: real('stable_tolerance').notNull().default(0.5),
  stableDurationMs: integer('stable_duration_ms').notNull().default(3000),
  theme: text('theme').notNull().default('system'),
  autoPrint: integer('auto_print', { mode: 'boolean' }).notNull().default(false),
  printerName: text('printer_name').notNull().default(''),
  printCopies: integer('print_copies').notNull().default(1),
  setupCompleted: integer('setup_completed', { mode: 'boolean' }).notNull().default(false),
});

// ---------- Vehicles ----------
export const vehicles = sqliteTable('vehicles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  tareWeight: real('tare_weight'),
  tareUnit: text('tare_unit'),
  createdAt: text('created_at').notNull(),
});

// ---------- Materials ----------
export const materials = sqliteTable('materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  createdAt: text('created_at').notNull(),
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
  vehicleId: integer('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  materialId: integer('material_id').references(() => materials.id, { onDelete: 'set null' }),
  remark: text('remark'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
