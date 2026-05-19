// packages/database/src/index.ts

import fs from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import * as schema from './schema/index.js';

export type DatabaseInstance = ReturnType<typeof drizzle<typeof schema>> & {
  /** Save the current in‑memory database back to disk */
  save: () => void;
  /** Close the database (without saving) */
  close: () => void;
};

/**
 * Initialise an SQL.js‑based database from the given file path.
 * If the file doesn't exist, it will be created.
 */
export async function initDatabase(dbPath: string): Promise<DatabaseInstance> {
  // Ensure the directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Load existing database or create empty
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(dbPath);
  } catch {
    buffer = Buffer.alloc(0);
  }

  const SQL = await initSqlJs();
  const sqldb = new SQL.Database(buffer);

  // Apply standard optimisations (sql.js supports PRAGMA)
  sqldb.run('PRAGMA journal_mode = WAL;'); // will be ignored (in‑memory), but harmless
  sqldb.run('PRAGMA busy_timeout = 5000;');
  sqldb.run('PRAGMA foreign_keys = ON;');

  const db = drizzle(sqldb, { schema });

  // Augment with save/close helpers
  const save = () => {
    const data = sqldb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  };

  const close = () => {
    sqldb.close();
  };

  return Object.assign(db, { save, close });
}
