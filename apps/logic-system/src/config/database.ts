import knex, { Knex } from 'knex';
import path from 'path';

export function setupDatabaseConnection(client: string, connection: string | object): Knex {
  return knex({
    client,
    connection,
    migrations: {
      tableName: 'knex_migrations',
      directory: path.join(__dirname, '../../db/migrations'),
    },
    seeds: {
      directory: path.join(__dirname, '../../db/seeds'),
    },
  });
} 