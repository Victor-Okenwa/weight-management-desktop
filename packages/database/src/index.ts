import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema/index.js';

export type DatabaseInstance = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Initialise the database at the given file path.
 * Applies WAL mode and other optimisations.
 * Returns a Drizzle ORM instance.
 */
export function initDatabase(dbPath: string): DatabaseInstance {
  const sqlite = new Database(dbPath);

  // Performance and reliability optimisations
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('busy_timeout = 5000');
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema });

  return db;
}
