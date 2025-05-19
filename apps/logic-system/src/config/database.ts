import knex from 'knex';
import { env } from './env';
import path from 'path';

// Initialize the knex instance with the database configuration
export const db = knex({
  client: 'pg',
  connection: env.DATABASE_URL,
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, '../../db/migrations'),
  },
  seeds: {
    directory: path.join(__dirname, '../../db/seeds'),
  },
}); 