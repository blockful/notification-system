import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { UserNotificationPreferencesRepository } from './user-notification-preferences.repository';
import { UserNotificationPreference } from '../interfaces/user_subscription.interface';

// ---- KNEX MOCK HELPERS ----

/**
 * Builds a chainable Knex query builder mock.
 * Each method returns `this` so chains like .where().whereIn().select() work.
 * `resolveWith` is the value that the chain eventually resolves to.
 */
function buildQueryMock(resolveWith: unknown) {
  const mock: Record<string, jest.Mock> = {};

  const chainMethods = ['where', 'whereIn', 'select', 'insert', 'onConflict', 'merge'] as const;

  for (const method of chainMethods) {
    mock[method] = jest.fn().mockReturnThis();
  }

  // The query builder itself is thenable (acts like a Promise)
  mock['then'] = jest.fn((onFulfilled: (value: unknown) => unknown) =>
    Promise.resolve(resolveWith).then(onFulfilled)
  );
  mock['catch'] = jest.fn((onRejected: (reason: unknown) => unknown) =>
    Promise.resolve(resolveWith).catch(onRejected)
  );

  return mock;
}

/** Creates a minimal Knex mock whose table accessor returns a query mock. */
function buildKnexMock(queryMock: ReturnType<typeof buildQueryMock>) {
  const knexFn = jest.fn().mockReturnValue(queryMock);

  // Attach fn.now() used by upsertMany
  (knexFn as unknown as Record<string, unknown>)['fn'] = { now: jest.fn().mockReturnValue('NOW()') };

  return knexFn;
}

// ---- TESTS ----

describe('UserNotificationPreferencesRepository', () => {
  // ----------------------------------------------------------------
  // filterActiveUsers
  // ----------------------------------------------------------------
  describe('filterActiveUsers', () => {
    test('returns all user IDs when none have disabled the trigger type', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      // No disabled rows returned from DB
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.filterActiveUsers(userIds, 'vote_cast');

      expect(result).toEqual(['user1', 'user2', 'user3']);
    });

    test('excludes users who have is_active: false for the trigger type', async () => {
      const userIds = ['user1', 'user2', 'user3'];
      // user2 has disabled the trigger
      const queryMock = buildQueryMock([{ user_id: 'user2' }]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.filterActiveUsers(userIds, 'vote_cast');

      expect(result).toEqual(['user1', 'user3']);
      expect(result).not.toContain('user2');
    });

    test('returns user IDs that have no row (missing row = enabled)', async () => {
      const userIds = ['user1', 'user4'];
      // No rows at all — both users have no preference record
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.filterActiveUsers(userIds, 'proposal_created');

      expect(result).toEqual(['user1', 'user4']);
    });

    test('returns empty array when given empty input', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.filterActiveUsers([], 'vote_cast');

      expect(result).toEqual([]);
      // Knex should never be called for empty input
      expect(knex).not.toHaveBeenCalled();
    });

    test('handles mix of enabled, disabled, and no-row users', async () => {
      // user1: has is_active=true row  (should be kept — not in disabled list)
      // user2: has is_active=false row (should be excluded — in disabled list)
      // user3: no row at all           (should be kept — missing = enabled)
      const userIds = ['user1', 'user2', 'user3'];
      const queryMock = buildQueryMock([{ user_id: 'user2' }]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.filterActiveUsers(userIds, 'vote_cast');

      expect(result).toContain('user1');
      expect(result).not.toContain('user2');
      expect(result).toContain('user3');
    });

    test('excludes all users when all have disabled the trigger type', async () => {
      const userIds = ['user1', 'user2'];
      const queryMock = buildQueryMock([{ user_id: 'user1' }, { user_id: 'user2' }]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.filterActiveUsers(userIds, 'vote_cast');

      expect(result).toEqual([]);
    });
  });

  // ----------------------------------------------------------------
  // findByUser
  // ----------------------------------------------------------------
  describe('findByUser', () => {
    test('returns empty array for user with no preferences', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.findByUser('user1');

      expect(result).toEqual([]);
    });

    test('returns all stored preferences for a user', async () => {
      const prefs: UserNotificationPreference[] = [
        { user_id: 'user1', trigger_type: 'vote_cast', is_active: true, updated_at: '2024-01-01' },
        { user_id: 'user1', trigger_type: 'proposal_created', is_active: false, updated_at: '2024-01-01' },
      ];

      const queryMock = buildQueryMock(prefs);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      const result = await repo.findByUser('user1');

      expect(result).toEqual(prefs);
      expect(result).toHaveLength(2);
    });

    test('queries the correct table and user_id', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      await repo.findByUser('user42');

      expect(knex).toHaveBeenCalledWith('user_notification_preferences');
      expect(queryMock.where).toHaveBeenCalledWith({ user_id: 'user42' });
      expect(queryMock.select).toHaveBeenCalledWith('*');
    });
  });

  // ----------------------------------------------------------------
  // upsertMany
  // ----------------------------------------------------------------
  describe('upsertMany', () => {
    test('does nothing when preferences array is empty', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      await repo.upsertMany('user1', []);

      // Knex table accessor should never be called
      expect(knex).not.toHaveBeenCalled();
    });

    test('inserts new rows for a user', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      await repo.upsertMany('user1', [
        { trigger_type: 'vote_cast', is_active: true },
      ]);

      expect(knex).toHaveBeenCalledWith('user_notification_preferences');
      expect(queryMock.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user1',
          trigger_type: 'vote_cast',
          is_active: true,
        }),
      ]);
    });

    test('uses onConflict merge to update existing rows', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      await repo.upsertMany('user1', [
        { trigger_type: 'vote_cast', is_active: false },
      ]);

      expect(queryMock.onConflict).toHaveBeenCalledWith(['user_id', 'trigger_type']);
      expect(queryMock.merge).toHaveBeenCalledWith(['is_active', 'updated_at']);
    });

    test('inserts multiple preferences in a single call', async () => {
      const queryMock = buildQueryMock([]);
      const knex = buildKnexMock(queryMock);

      const repo = new UserNotificationPreferencesRepository(knex as never);
      await repo.upsertMany('user1', [
        { trigger_type: 'vote_cast', is_active: true },
        { trigger_type: 'proposal_created', is_active: false },
      ]);

      expect(queryMock.insert).toHaveBeenCalledWith([
        expect.objectContaining({ trigger_type: 'vote_cast', is_active: true }),
        expect.objectContaining({ trigger_type: 'proposal_created', is_active: false }),
      ]);
    });
  });
});
