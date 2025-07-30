import { db } from './database-config';

/**
 * @notice Sets up the database by rolling back and applying migrations
 * @dev Ensures a clean database state for integration tests
 * @return Promise that resolves when database setup is complete
 */
export async function setupDatabase(): Promise<void> {
  await db.migrate.rollback();
  await db.migrate.latest();
} 