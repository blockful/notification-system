import { createTables } from './schema';
import { seedTestData } from './seed';

export async function setupDatabase(): Promise<void> {
  await createTables();
  await seedTestData();
  console.log('PostgreSQL database setup completed successfully');
}