import { db } from './database-config';
import { v4 as uuidv4 } from 'uuid';

export async function setupDatabase(): Promise<void> {
  await db.migrate.rollback();
  await db.migrate.latest();
}

export async function createTestData() {
  const now = new Date().toISOString();
  const testUser = await createTestUser(now);
  const daoId = 'test-dao-id';
  const testUserPreference = await createTestUserPreference(testUser.id, daoId, now);
  return { 
    testUser, 
    testUserPreference,
    daoId 
  };
}

async function createTestUser(timestamp: string) {
  const user = {
    id: uuidv4(),
    channel: 'telegram',
    channel_user_id: '123456789',
    created_at: timestamp
  };
  await db('users').insert(user);
  return user;
}

async function createTestUserPreference(userId: string, daoId: string, timestamp: string) {
  const preference = {
    id: uuidv4(),
    user_id: userId,
    dao_id: daoId,
    is_active: true,
    created_at: timestamp,
    updated_at: timestamp
  };
  await db('user_preferences').insert(preference);
  return preference;
} 