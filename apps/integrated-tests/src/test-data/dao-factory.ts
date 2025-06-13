import { db } from '../setup/database-config';

export interface DaoData {
  id: string;
}

export class DaoFactory {
  static async createDao(daoName: string): Promise<DaoData> {
    const dao = {
      id: daoName 
    };
    await db('dao').insert(dao);
    return dao;
  }

  static async createMultipleDaos(daoNames: string[]): Promise<DaoData[]> {
    const daos = await Promise.all(
      daoNames.map(name => this.createDao(name))
    );
    return daos;
  }
}