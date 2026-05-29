import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DatabaseInstance, initDatabase } from '@weight/database';
import { settings } from '@weight/database/schema';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import { app } from 'electron';
import { logger } from '../logger.js';

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
  const existingSettings = db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.id, 1))
    .get();

  if (!existingSettings) {
    logger.log('First run – seeding default settings.');
    db.insert(settings)
      .values({
        id: 1,
        companyName: '',
        companyEmail: '',
        companyAddress: '',
        companyPhone: '',
        companyLogoPath: '',
        ticketPrefix: 'SRE',
        ticketFooter: 'Thank you for your custom',
        nextTicketNumber: 1,
        serialPort: 'COM1',
        baudRate: 2400,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        indicatorType: 'd300',
        autoOpen: false,
        flowControl: 'none',
        weightUnit: 'kg',
        stableTolerance: 0.5,
        stableDurationMs: 3000,
        theme: 'system',
        autoPrint: false,
        printerName: '',
        printCopies: 1,
        setupCompleted: false,
      })
      .run();
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
