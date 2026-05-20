// packages/database/src/migrate.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/sql-js';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import initSqlJs from 'sql.js';

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsFolder = path.join(__dirname, '..', 'drizzle');
const dbPath = path.join(__dirname, '..', 'data', 'dev.db');

async function runMigrations() {
  // Load existing database file (or start fresh)
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(dbPath);
  } catch {
    buffer = Buffer.alloc(0);
  }

  const SQL = await initSqlJs();
  const sqldb = new SQL.Database(buffer);
  const db = drizzle(sqldb);

  // Apply migrations
  await migrate(db, { migrationsFolder });

  // Write back to disk
  const data = sqldb.export();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  fs.writeFileSync(dbPath, Buffer.from(data));

  console.log('Migrations applied successfully.');
  sqldb.close();
}

runMigrations().catch((err) => {
  console.error(err);
  process.exit(1);
});
