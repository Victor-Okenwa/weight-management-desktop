import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DatabaseInstance, initDatabase } from '@weight/database';
import { getAllSettings, setSetting } from '@weight/database/repositories/settings';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import { app } from 'electron';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance: DatabaseInstance | null = null;

export async function setupDatabase(): Promise<DatabaseInstance> {
  const isDev = !app.isPackaged;

  const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(app.getPath('userData'), 'data.db');

  console.log(`Using database: ${dbPath}`);

  const db = await initDatabase(dbPath);

  // Path to migrations (drizzle folder in the database package)
  const migrationsFolder = isDev
    ? path.join(__dirname, '..', '..', 'packages', 'database', 'drizzle')
    : path.join(process.resourcesPath, 'migrations');

  try {
    migrate(db, { migrationsFolder });
    console.log('Database migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  }

  // Seed default settings if first run
  const existingSettings = getAllSettings(db);
  if (Object.keys(existingSettings).length === 0) {
    console.log('First run – seeding default settings.');
    const defaults: Record<string, string> = {
      company_name: '',
      company_address: '',
      company_phone: '',
      company_logo_path: '',
      ticket_prefix: 'SRW',
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
      setup_completed: 'false',
    };
    for (const [key, value] of Object.entries(defaults)) {
      setSetting(db, key, value);
    }
    db.save();
  }

  dbInstance = db;
  return db;
}

export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    throw new Error('Database not initialised. Call setupDatabase() first.');
  }
  return dbInstance;
}
