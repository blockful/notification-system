import { describe, test, expect, beforeEach } from '@jest/globals';
import { SettingsService } from './settings.service';
import {
  IUserNotificationPreferencesRepository,
  UserNotificationPreference,
} from '../interfaces/user_subscription.interface';

// ---- STUB ----

const FIXED_DATE = '2025-06-01T00:00:00.000Z';

class StubPrefsRepo implements IUserNotificationPreferencesRepository {
  findByUserResult: UserNotificationPreference[] = [];
  upsertManyCalls: Array<{
    userId: string;
    preferences: { trigger_type: string; is_active: boolean }[];
  }> = [];

  async findByUser(): Promise<UserNotificationPreference[]> {
    return this.findByUserResult;
  }

  async upsertMany(
    userId: string,
    preferences: { trigger_type: string; is_active: boolean }[],
  ): Promise<void> {
    this.upsertManyCalls.push({ userId, preferences });
  }

  async filterActiveUsers(): Promise<string[]> {
    return [];
  }
}

// ---- TESTS ----

describe('SettingsService', () => {
  let stub: StubPrefsRepo;
  let settingsService: SettingsService;

  beforeEach(() => {
    stub = new StubPrefsRepo();
    settingsService = new SettingsService(stub);
  });

  describe('getUserPreferences', () => {
    test('returns stored preferences for a user', async () => {
      stub.findByUserResult = [
        { user_id: 'user-1', trigger_type: 'new-proposal', is_active: true, updated_at: FIXED_DATE },
        { user_id: 'user-1', trigger_type: 'vote-confirmation', is_active: false, updated_at: FIXED_DATE },
      ];

      const result = await settingsService.getUserPreferences('user-1');

      expect(result).toEqual([
        { user_id: 'user-1', trigger_type: 'new-proposal', is_active: true, updated_at: FIXED_DATE },
        { user_id: 'user-1', trigger_type: 'vote-confirmation', is_active: false, updated_at: FIXED_DATE },
      ]);
    });

    test('returns empty array for user with no preferences', async () => {
      const result = await settingsService.getUserPreferences('unknown-user');

      expect(result).toEqual([]);
    });
  });

  describe('saveUserPreferences', () => {
    test('delegates to repository for valid preferences', async () => {
      const preferences = [
        { trigger_type: 'new-proposal', is_active: true },
        { trigger_type: 'vote-confirmation', is_active: false },
      ];

      await settingsService.saveUserPreferences('user-1', preferences);

      expect(stub.upsertManyCalls).toEqual([
        {
          userId: 'user-1',
          preferences: [
            { trigger_type: 'new-proposal', is_active: true },
            { trigger_type: 'vote-confirmation', is_active: false },
          ],
        },
      ]);
    });

    test('throws on invalid trigger_type not in NOTIFICATION_TYPES', async () => {
      await expect(
        settingsService.saveUserPreferences('user-1', [
          { trigger_type: 'invalid-trigger', is_active: true },
        ]),
      ).rejects.toThrow('Unknown trigger types: invalid-trigger');

      expect(stub.upsertManyCalls).toEqual([]);
    });

    test('throws when multiple invalid trigger_types are provided', async () => {
      await expect(
        settingsService.saveUserPreferences('user-1', [
          { trigger_type: 'new-proposal', is_active: true },
          { trigger_type: 'bad-trigger-1', is_active: false },
          { trigger_type: 'bad-trigger-2', is_active: true },
        ]),
      ).rejects.toThrow('Unknown trigger types: bad-trigger-1, bad-trigger-2');

      expect(stub.upsertManyCalls).toEqual([]);
    });

    test('accepts all valid trigger_types from NOTIFICATION_TYPES', async () => {
      const validPreferences = [
        { trigger_type: 'new-proposal', is_active: true },
        { trigger_type: 'new-offchain-proposal', is_active: true },
        { trigger_type: 'proposal-finished', is_active: false },
        { trigger_type: 'non-voting', is_active: true },
        { trigger_type: 'voting-reminder-30', is_active: false },
        { trigger_type: 'voting-reminder-60', is_active: true },
        { trigger_type: 'voting-reminder-90', is_active: false },
        { trigger_type: 'voting-power-changed', is_active: true },
        { trigger_type: 'vote-confirmation', is_active: true },
        { trigger_type: 'offchain-vote-cast', is_active: false },
      ];

      await settingsService.saveUserPreferences('user-1', validPreferences);

      expect(stub.upsertManyCalls).toEqual([
        { userId: 'user-1', preferences: validPreferences },
      ]);
    });

    test('throws on empty string trigger_type', async () => {
      await expect(
        settingsService.saveUserPreferences('user-1', [
          { trigger_type: '', is_active: true },
        ]),
      ).rejects.toThrow('Unknown trigger types: ');

      expect(stub.upsertManyCalls).toEqual([]);
    });
  });
});
