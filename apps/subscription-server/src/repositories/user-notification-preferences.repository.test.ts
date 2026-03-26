import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { knex, Knex } from 'knex';
import ClientPgLite from 'knex-pglite';
import path from 'path';
import { UserNotificationPreferencesRepository } from './user-notification-preferences.repository';

// ---- TEST DB SETUP ----

const FIXED_DATE = '2025-06-01T00:00:00.000Z';

function createTestDb(): Knex {
  return knex({
    client: ClientPgLite,
    connection: { connectionString: 'memory://' },
    useNullAsDefault: true,
    migrations: {
      directory: [path.resolve(__dirname, '../../db/migrations')],
    },
  });
}

let db: Knex;
let repo: UserNotificationPreferencesRepository;

async function seedUser(id: string): Promise<void> {
  await db('users').insert({
    id,
    channel: 'telegram',
    channel_user_id: `chan-${id}`,
    created_at: FIXED_DATE,
  });
}

async function seedPreference(
  userId: string,
  triggerType: string,
  isActive: boolean,
): Promise<void> {
  await db('user_notification_preferences').insert({
    user_id: userId,
    trigger_type: triggerType,
    is_active: isActive,
    updated_at: FIXED_DATE,
  });
}

beforeAll(async () => {
  db = createTestDb();
  await db.migrate.latest();
  repo = new UserNotificationPreferencesRepository(db);
});

afterAll(async () => {
  await db.destroy();
});

beforeEach(async () => {
  await db('user_notification_preferences').del();
  await db('notifications').del();
  await db('user_preferences').del();
  await db('users').del();
});

// ---- TESTS ----

describe('UserNotificationPreferencesRepository', () => {
  // ----------------------------------------------------------------
  // filterActiveUsers
  // ----------------------------------------------------------------
  describe('filterActiveUsers', () => {
    test('returns all user IDs when none have disabled the trigger type', async () => {
      await seedUser('user1');
      await seedUser('user2');
      await seedUser('user3');

      const result = await repo.filterActiveUsers(['user1', 'user2', 'user3'], 'vote_cast');

      expect(result).toEqual(['user1', 'user2', 'user3']);
    });

    test('excludes users who have is_active: false for the trigger type', async () => {
      await seedUser('user1');
      await seedUser('user2');
      await seedUser('user3');
      await seedPreference('user2', 'vote_cast', false);

      const result = await repo.filterActiveUsers(['user1', 'user2', 'user3'], 'vote_cast');

      expect(result).toEqual(['user1', 'user3']);
    });

    test('returns user IDs that have no row (missing row = enabled)', async () => {
      await seedUser('user1');
      await seedUser('user4');

      const result = await repo.filterActiveUsers(['user1', 'user4'], 'proposal_created');

      expect(result).toEqual(['user1', 'user4']);
    });

    test('returns empty array when given empty input', async () => {
      const result = await repo.filterActiveUsers([], 'vote_cast');

      expect(result).toEqual([]);
    });

    test('handles mix of enabled, disabled, and no-row users', async () => {
      await seedUser('user1');
      await seedUser('user2');
      await seedUser('user3');
      await seedPreference('user1', 'vote_cast', true);
      await seedPreference('user2', 'vote_cast', false);

      const result = await repo.filterActiveUsers(['user1', 'user2', 'user3'], 'vote_cast');

      expect(result).toEqual(['user1', 'user3']);
    });

    test('excludes all users when all have disabled the trigger type', async () => {
      await seedUser('user1');
      await seedUser('user2');
      await seedPreference('user1', 'vote_cast', false);
      await seedPreference('user2', 'vote_cast', false);

      const result = await repo.filterActiveUsers(['user1', 'user2'], 'vote_cast');

      expect(result).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // findByUser
  // ----------------------------------------------------------------
  describe('findByUser', () => {
    test('returns empty array for user with no preferences', async () => {
      await seedUser('user1');

      const result = await repo.findByUser('user1');

      expect(result).toEqual([]);
    });

    test('returns all stored preferences for a user', async () => {
      await seedUser('user1');
      await seedPreference('user1', 'vote_cast', true);
      await seedPreference('user1', 'proposal_created', false);

      const result = await repo.findByUser('user1');

      expect(result).toEqual([
        { user_id: 'user1', trigger_type: 'proposal_created', is_active: false, updated_at: new Date(FIXED_DATE) },
        { user_id: 'user1', trigger_type: 'vote_cast', is_active: true, updated_at: new Date(FIXED_DATE) },
      ]);
    });
  });

  // ----------------------------------------------------------------
  // upsertMany
  // ----------------------------------------------------------------
  describe('upsertMany', () => {
    test('does nothing when preferences array is empty', async () => {
      await seedUser('user1');

      await repo.upsertMany('user1', []);

      const rows = await db('user_notification_preferences').select('*');
      expect(rows).toEqual([]);
    });

    test('inserts new rows for a user', async () => {
      await seedUser('user1');

      await repo.upsertMany('user1', [
        { trigger_type: 'vote_cast', is_active: true },
      ]);

      const rows = await db('user_notification_preferences').select('*');
      expect(rows).toEqual([
        {
          user_id: 'user1',
          trigger_type: 'vote_cast',
          is_active: true,
          updated_at: expect.any(Date),
        },
      ]);
    });

    test('updates existing rows on conflict (upsert)', async () => {
      await seedUser('user1');
      await seedPreference('user1', 'vote_cast', true);

      await repo.upsertMany('user1', [
        { trigger_type: 'vote_cast', is_active: false },
      ]);

      const rows = await db('user_notification_preferences').select('*');
      expect(rows).toEqual([
        {
          user_id: 'user1',
          trigger_type: 'vote_cast',
          is_active: false,
          updated_at: expect.any(Date),
        },
      ]);
    });

    test('inserts multiple preferences in a single call', async () => {
      await seedUser('user1');

      await repo.upsertMany('user1', [
        { trigger_type: 'vote_cast', is_active: true },
        { trigger_type: 'proposal_created', is_active: false },
      ]);

      const rows = await db('user_notification_preferences')
        .select('*')
        .orderBy('trigger_type');
      expect(rows).toEqual([
        {
          user_id: 'user1',
          trigger_type: 'proposal_created',
          is_active: false,
          updated_at: expect.any(Date),
        },
        {
          user_id: 'user1',
          trigger_type: 'vote_cast',
          is_active: true,
          updated_at: expect.any(Date),
        },
      ]);
    });
  });
});
