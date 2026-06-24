import { desc, eq } from 'drizzle-orm';
import type { DatabaseInstance } from '../index.js';
import { materials, records, settings, vehicles } from '../schema/index.js';

export interface HealthRow {
  id: number;
  [key: string]: unknown;
}

export interface TableSample {
  count: number;
  sample: HealthRow[];
}

export interface HealthResult {
  ok: boolean;
  timestamp: string;
  tables: {
    settings: TableSample;
    vehicles: TableSample;
    materials: TableSample;
    records: TableSample;
  };
}

export function checkDatabaseHealth(db: DatabaseInstance): HealthResult {
  const settingsRows = db.select().from(settings).all().slice(-5) as HealthRow[];
  const vehiclesRows = db
    .select()
    .from(vehicles)
    .orderBy(desc(vehicles.id))
    .limit(5)
    .all() as HealthRow[];
  const materialsRows = db
    .select()
    .from(materials)
    .orderBy(desc(materials.id))
    .limit(5)
    .all() as HealthRow[];
  const recordsRows = db
    .select()
    .from(records)
    .orderBy(desc(records.id))
    .limit(5)
    .all() as HealthRow[];

  const tables = {
    settings: { count: settingsRows.length, sample: settingsRows },
    vehicles: { count: vehiclesRows.length, sample: vehiclesRows },
    materials: { count: materialsRows.length, sample: materialsRows },
    records: { count: recordsRows.length, sample: recordsRows },
  };

  const result: HealthResult = {
    ok: true,
    timestamp: new Date().toISOString(),
    tables,
  };

  console.table(
    Object.fromEntries(Object.entries(tables).map(([name, data]) => [name, data.count])),
  );

  for (const [name, data] of Object.entries(tables)) {
    console.groupCollapsed(`[DB] Table: ${name}`);
    console.table(data.sample);
    console.groupEnd();
  }

  return result;
}
