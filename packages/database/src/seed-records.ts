/**
 * One-off CLI: seed 15 dummy records into packages/database/data/dev.db
 * Usage: pnpm --filter @weight/database db:seed-records
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/sql-js/migrator';
import { initDatabase } from './index.js';
import { seedDummyRecords } from './repositories/seed-dummy-records.js';
import { ensureInstallationRow } from './repositories/installation.js';
import { settings } from './schema/index.js';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dbPath = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '..', 'data', 'dev.db');

  const migrationsFolder = path.join(__dirname, '..', 'drizzle');

  console.log(`Seeding records into: ${dbPath}`);

  const db = await initDatabase(dbPath);
  migrate(db, { migrationsFolder });

  const existingSettings = db
    .select({ id: settings.id })
    .from(settings)
    .where(eq(settings.id, 1))
    .get();

  if (!existingSettings) {
    db.insert(settings)
      .values({
        id: 1,
        companyName: 'Solution Road Demo',
        companyEmail: 'demo@solutionroad.test',
        companyAddress: '12 Weighbridge Rd',
        companyPhone: '+2348000000000',
        ticketPrefix: 'SRE',
        ticketFooter: 'Thank you for your custom',
        nextTicketNumber: 1,
        printAuto: false,
        printPrinterName: '',
        printCopies: 1,
        printPaperSize: '80mm',
      })
      .run();
  }

  ensureInstallationRow(db);

  const seeded = seedDummyRecords(db);
  db.save();
  db.close();

  if (seeded) {
    console.log('Inserted 15 dummy records (remark prefix [seed]).');
  } else {
    console.log('Seed skipped — dummy records already present.');
  }

  // Touch file mtime so watchers notice (optional)
  if (fs.existsSync(dbPath)) {
    const now = new Date();
    fs.utimesSync(dbPath, now, now);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
