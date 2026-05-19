// apps/desktop/src/database/connection.ts

import path from 'node:path';
import type { DatabaseInstance } from '@weight/database';
import { initDatabase } from '@weight/database';
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

  dbInstance = db;
  return db;
}

export function getDatabase(): DatabaseInstance {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return dbInstance;
}
