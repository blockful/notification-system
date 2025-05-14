import dotenv from 'dotenv';
import { Knex } from 'knex';
import path from 'path';
import { env } from './src/config/env';

// Load environment variables
dotenv.config();

const config: Knex.Config = {
  client: 'pg',
  connection: env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: path.join(__dirname, 'db/migrations')
  },
  seeds: {
    directory: path.join(__dirname, 'db/seeds')
  }
};

export default config; 