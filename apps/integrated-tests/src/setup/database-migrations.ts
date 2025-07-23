import { db } from './database-config';

export async function setupDatabase(): Promise<void> {
  await db.migrate.rollback();
  await db.migrate.latest();
} 