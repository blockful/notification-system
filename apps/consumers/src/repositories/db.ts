/**
 * Database connection and queries for the Telegram bot.
 * Handles DAO information fetching from anticapture database
 */

import { Knex } from 'knex';
import { IDatabaseService } from '../interfaces/db.interface';

export class DatabaseService implements IDatabaseService {
  private daosDb: Knex;

  constructor(daosDb: Knex) {
    this.daosDb = daosDb;
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
} 