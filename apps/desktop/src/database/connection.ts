import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type DatabaseInstance, initDatabase } from '@weight/database';
import { ensureInstallationRow } from '@weight/database/repositories/installation';
import { seedDummyRecords } from '@weight/database/repositories/seed-dummy-records';
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

  // Path to migrations (drizzle folder in the database package).
  // In dev, compiled code lives in apps/desktop/dist/database → climb to repo root.
  const migrationsFolder = isDev
    ? path.join(__dirname, '..', '..', '..', '..', 'packages', 'database', 'drizzle')
    : path.join(process.resourcesPath, 'migrations');

  logger.info(`Applying migrations from: ${migrationsFolder}`);

  try {
    migrate(db, { migrationsFolder });
    console.log('Database migrations applied successfully.');
    logger.info('Database migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    logger.error(`Migration failed: ${(err as Error).message}`);
    throw err;
  }

  db.save();

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
        printAuto: false,
        printPrinterName: '',
        printCopies: 1,
        printPaperSize: '80mm',
      })
      .run();
  }

  // Always ensure the single-row installation record exists
  try {
    ensureInstallationRow(db);
  } catch (err) {
    logger.error(`Failed to ensure installation row: ${(err as Error).message}`);
  }

  // Dev-only: seed 15 dummy weigh tickets once for print / history testing
  if (isDev) {
    try {
      const seeded = seedDummyRecords(db);
      if (seeded) {
        logger.log('Seeded 15 dummy records for print testing.');
      }
    } catch (err) {
      logger.error(`Failed to seed dummy records: ${(err as Error).message}`);
    }
  }

  db.save();

  dbInstance = db;
  return db;
}

export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return dbInstance;
}
