/**
 * Database service for DAO information.
 * Handles connection to the PostgreSQL database for DAOs.
 */

import knex, { Knex } from 'knex';

export class DatabaseService {
  private daosDb: Knex;

  constructor(daosDbConnectionString: string) {
    this.daosDb = knex({
      client: 'pg',
      connection: daosDbConnectionString
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
} 