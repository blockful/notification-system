import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const config: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
  migrations: {
    directory: './db/migrations',
    extension: 'ts'
  }
};

export default config;