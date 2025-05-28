import * as dotenv from 'dotenv';
import Knex, { Knex as KnexType } from 'knex';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/'),
  PORT: z.coerce.number().positive().default(3000),
});

const env = envSchema.safeParse(process.env);
if (!env.success) {
  console.error('Invalid environment variables:', env.error.format());
  process.exit(1);
}

export function setupDatabaseConnection(client: string, connection: string | object): KnexType {
  return Knex({
    client,
    connection,
  });
}

export const config = {
  databaseUrl: env.data.DATABASE_URL,
  port: env.data.PORT,
}; 