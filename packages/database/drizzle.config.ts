// @ts-nocheck
import path from 'node:path';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/index.ts',
  out: './drizzle', // where migration files will be generated
  dialect: 'sqlite',
  dbCredentials: {
    // Drizzle Kit needs a database file to introspect for drift detection.
    // Point it to the development database file location. We'll use a local `data/dev.db`.
    url: path.join(__dirname, 'data', 'dev.db'),
  },
} satisfies Config;
