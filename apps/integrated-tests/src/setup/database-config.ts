/**
 * Database configuration for integration tests
 * 
 * This module sets up a SQLite database connection specifically for integration testing.
 * Uses a temporary file location to ensure test isolation and avoid conflicts with
 * production or development databases.
 * 
 * Now configured to use the same migrations as production for consistency.
 */

import { knex } from 'knex';
import path from 'path';

export const db = knex({
  client: 'sqlite3',
  connection: {
    filename: '/tmp/test_integration.db'
  },
  useNullAsDefault: true,
  migrations: {
    directory: [
      // Including migrations from all apps to have the complete schema
      path.join(__dirname, '../../../logic-system/db/migrations'),
      path.join(__dirname, '../../../subscription-server/db/migrations')
    ]
  }
});

export function closeDatabase(): void {
  db.destroy();
}