import { Knex } from 'knex';

/**
 * Fast database cleanup for test isolation
 * Uses TRUNCATE for speed instead of DELETE/ROLLBACK
 */
export class DatabaseCleanup {
  private db: Knex;
  
  // Tables that need to be cleaned between tests, in dependency order
  private static readonly TABLES_TO_CLEAN = [
    'notifications',
    'user_preferences', 
    'users'
  ];

  constructor(db: Knex) {
    this.db = db;
  }

  /**
   * Truncates all test data tables
   * Uses transaction for atomicity
   */
  async cleanAllTables(): Promise<void> {
    await this.db.transaction(async (trx) => {
      // Disable foreign key checks temporarily for faster truncation
      await trx.raw('PRAGMA foreign_keys = OFF');
      
      for (const tableName of DatabaseCleanup.TABLES_TO_CLEAN) {
        await trx.raw(`DELETE FROM ${tableName}`);
      }
      
      // Re-enable foreign key checks
      await trx.raw('PRAGMA foreign_keys = ON');
    });
  }

  /**
   * Clean specific table
   */
  async cleanTable(tableName: string): Promise<void> {
    await this.db(tableName).delete();
  }
}