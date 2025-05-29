/**
 * Database configuration
 * 
 * Centralizes database connection setup for the application
 */

import knex, { Knex } from 'knex';

export function setupDatabaseConnection(client: string, connection: string | object, isProduction: boolean): Knex {
  const db = knex({
    client,
    connection,
  });

  /**
   * Disable potentially dangerous database operations by overriding their getters
   * to throw errors. This prevents accidental execution of destructive operations
   * like running migrations, seeds, or schema changes in production environments
   * where the database connection should be read-only.
   * 
   * Only applies this protection in production environments.
   */
  if (isProduction) {
    const BLOCKED_OPERATIONS = ['migrate', 'seed', 'schema'] as const;
    
    BLOCKED_OPERATIONS.forEach(method => {
      Object.defineProperty(db, method, {
        get() {
          throw new Error(`${method} operations are disabled in read-only mode`);
        }
      });
    });
  }

  return db;
}
