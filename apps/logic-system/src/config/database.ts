import knex, { Knex } from 'knex';
import path from 'path';

export function setupDatabaseConnection(client: string, connection: string | object): Knex {
  const db = knex({
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

  /**
   * Disable potentially dangerous database operations by overriding their getters
   * to throw errors. This prevents accidental execution of destructive operations
   * like running migrations, seeds, or schema changes.
   * 
   * These operations are always blocked for safety.
   */
  const BLOCKED_OPERATIONS = ['migrate', 'seed', 'schema'] as const;
  
  BLOCKED_OPERATIONS.forEach(method => {
    Object.defineProperty(db, method, {
      get() {
        throw new Error(`${method} operations are disabled in read-only mode`);
      }
    });
  });
  
  return db;
} 