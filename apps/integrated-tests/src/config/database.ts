import { knex } from 'knex';
import { z } from 'zod';

// Validate environment variables with Zod
const envSchema = z.object({
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().positive().default(5432),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  POSTGRES_DB: z.string().default('test_db')
});

const env = envSchema.parse(process.env);

export const db = knex({
  client: 'pg',
  connection: {
    host: env.POSTGRES_HOST,
    port: env.POSTGRES_PORT,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    database: env.POSTGRES_DB
  }
});

export function closeDatabase(): void {
  db.destroy();
} 