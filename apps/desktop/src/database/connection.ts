// apps/desktop/src/database/connection.ts

import path from 'node:path';
import type { DatabaseInstance } from '@weight/database';
import { initDatabase } from '@weight/database';
import { getAllSettings, setSetting } from '@weight/database/repositories/settings';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import { app } from 'electron';
import { logger } from '../logger.js';

let dbInstance: DatabaseInstance | null = null;

export async function setupDatabase(): Promise<DatabaseInstance> {
  const isDev = !app.isPackaged;

  const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(app.getPath('userData'), 'data.db');

  logger.info(`Using database: ${dbPath}`);

  // Initialise the sql.js‑based database
  const db = await initDatabase(dbPath);

  // Run migrations (using the same sql.js migrator)
  const migrationsFolder = isDev
    ? path.join(__dirname, '..', '..', 'packages', 'database', 'drizzle')
    : path.join(process.resourcesPath, 'migrations');

  try {
    // Migrations will be applied to the in‑memory database
    migrate(db, { migrationsFolder });
    logger.log('Database migrations applied successfully.');
    db.save(); // save after migration so changes are persisted
  } catch (err) {
    logger.error('Migration failed:', err);
    // Optionally show an error dialog and quit
  }

  // Seed default settings if this is the first run
  const existingSettings = getAllSettings(db);
  if (Object.keys(existingSettings).length === 0) {
    console.log('First run – seeding default settings.');
    const defaults: Record<string, string> = {
      setup_completed: 'false',
      company_name: '',
      company_address: '',
      company_phone: '',
      company_logo_path: '',
      ticket_prefix: 'SRW', // can be auto‑computed later
      ticket_footer: 'Thank you for your custom',
      next_ticket_number: '1',
      serial_port: 'COM1',
      baud_rate: '2400',
      indicator_type: 'd300',
      weight_unit: 'kg',
      stable_tolerance: '0.5',
      stable_duration_ms: '3000',
      theme: 'system',
      auto_print: 'false',
      printer_name: '',
      print_copies: '1',
    };

    for (const [key, value] of Object.entries(defaults)) {
      setSetting(db, key, value);
    }

    // Persist the seeded settings to disk
    db.save();
  }

  dbInstance = db;
  return db;
}

export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return dbInstance;
}
