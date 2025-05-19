/**
 * Database connection and queries for the Telegram bot.
 * Handles connections to both PostgreSQL databases:
 * - DAOs database: Contains DAO information
 * - Users database: Contains user preferences and addresses
 */

import knex, { Knex } from 'knex';
import { IDatabaseService } from '../interfaces/db.interface';

export class DatabaseService implements IDatabaseService {
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
    await this.usersDb.transaction(async trx => { 
      const valuesToInsert = Array.from(daoIds).map(daoId => ({
        user_id: userId,
        dao_id: daoId
      }));
      await trx('user_preferences')
        .insert(valuesToInsert)
        .onConflict(['user_id', 'dao_id'])
        .merge();
    });    
  }
} 