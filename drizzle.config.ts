import 'dotenv/config';
import type { Config } from 'drizzle-kit';

export default {
  out: './drizzle',
  dialect: 'postgresql',
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} as Config;
