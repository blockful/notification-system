/**
 * Database connection and queries for the Telegram bot.
 * Handles connections to both PostgreSQL databases:
 * - DAOs database: Contains DAO information
 * - Users database: Contains user preferences and addresses
 */

import { Pool } from 'pg';

interface DAORow {
  id: string;
}

export class DatabaseService {
  private daosPool: Pool;
  private usersPool: Pool;

  constructor(daosConnectionString: string, usersConnectionString: string) {
    this.daosPool = new Pool({
      connectionString: daosConnectionString
    });

    this.usersPool = new Pool({
      connectionString: usersConnectionString
    });
  }

  public async getDAOs(): Promise<string[]> {
    try {
      const result = await this.daosPool.query<DAORow>('SELECT id FROM dao');
      return result.rows.map(row => row.id);
    } catch (error) {
      console.error('Error fetching DAOs:', error);
      return [];
    }
  }

  public async saveUserPreferences(userId: number, daoIds: Set<string>): Promise<void> {
    const client = await this.usersPool.connect();
    try {
      await client.query('BEGIN');
      for (const daoId of daoIds) {
        await client.query(
          'INSERT INTO user_preferences (user_id, dao_id) VALUES ($1, $2) ON CONFLICT (user_id, dao_id) DO NOTHING',
          [userId, daoId]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error saving user preferences:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Add any other database methods here
} 