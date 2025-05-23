/**
 * Database configuration
 * 
 * Centralizes database connection setup for the application
 */

import knex, { Knex } from 'knex';

export function setupDatabaseConnection(client: string, connection: string | object): Knex {
  return knex({
    client,
    connection,
  });
}
