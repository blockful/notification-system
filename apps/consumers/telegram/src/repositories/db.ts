/**
 * Database connection and queries for the Telegram bot.
 * Handles connections to both PostgreSQL databases:
 * - DAOs database: Contains DAO information
 * - Users database: Contains user preferences and addresses
 */

import knex, { Knex } from 'knex';

export class DatabaseService {
  private daosDb: Knex;
  private usersDb: Knex;

  constructor(daosDbConnectionString: string, usersDbConnectionString: string) {
    this.daosDb = knex({
      client: 'pg',
      connection: daosDbConnectionString
    });
    this.usersDb = knex({
      client: 'pg',
      connection: usersDbConnectionString
    });
  }

  public async getDAOs(): Promise<string[]> {
    try {
      const result = await this.daosDb<{ id: string }>('dao').select('id');
      return result.map(row => row.id);
    } catch (error) {
      console.error('Error fetching DAOs:', error);
      return [];
    }
  }

  public async saveUserPreferences(userId: number, daoIds: Set<string>): Promise<void> {
    const trx = await this.usersDb.transaction();
    try {
      const queries = Array.from(daoIds).map(daoId => 
        trx('user_preferences')
          .insert({ user_id: userId, dao_id: daoId })
          .onConflict(['user_id', 'dao_id'])
          .merge()
      );
      await Promise.all(queries);
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  /**
   * Check if a user exists in the database
   * @param userId Telegram user/chat ID
   * @returns Boolean indicating if user exists
   */
  public async userExists(userId: number): Promise<boolean> {
    const result = await this.usersDb('user_preferences')
      .where({ user_id: userId })
      .first();
    return !!result;
  }
} 