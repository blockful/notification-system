/**
 * Database configuration for integration tests
 * 
 * This module sets up a SQLite database connection specifically for integration testing.
 * Uses a temporary file location to ensure test isolation and avoid conflicts with
 * production or development databases.
 * 
 */

import { knex } from 'knex';

export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: '/tmp/test_integration.db'
  },
  useNullAsDefault: true
});

export function closeDatabase(): void {
  db.destroy();
} 