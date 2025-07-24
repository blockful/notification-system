import { Knex } from 'knex';
import { testConstants } from '../../config';

/**
 * Fast database cleanup for test isolation
 */
export class DatabaseCleanup {
  private db: Knex;
  private static readonly TABLES_TO_CLEAN = [
    'user_addresses',
    testConstants.tables.notifications,
    testConstants.tables.userPreferences,
    testConstants.tables.users
  ];

  constructor(db: Knex) {
    this.db = db;
  }

  /**
   * Cleans all test data tables using native Knex methods
   * Uses transaction for atomicity
   */
  async cleanAllTables(): Promise<void> {
    await this.db.transaction(async (trx) => {
      for (const tableName of DatabaseCleanup.TABLES_TO_CLEAN) {
        await trx(tableName).delete();
      }
    });
  }
}