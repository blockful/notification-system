import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { SettingsService } from './settings.service';
import { IUserNotificationPreferencesRepository, UserNotificationPreference } from '../interfaces/user_subscription.interface';

// ---- REPOSITORY MOCK ----
const createMockPrefsRepo = (): jest.Mocked<IUserNotificationPreferencesRepository> => ({
  findByUser: jest.fn(),
  upsertMany: jest.fn(),
  filterActiveUsers: jest.fn(),
});

// ---- TESTS ----
describe('SettingsService', () => {
  let prefsRepo: jest.Mocked<IUserNotificationPreferencesRepository>;
  let settingsService: SettingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prefsRepo = createMockPrefsRepo();
    settingsService = new SettingsService(prefsRepo);
  });

  describe('getUserPreferences', () => {
    test('returns stored preferences for a user', async () => {
      const mockPrefs: UserNotificationPreference[] = [
        { user_id: 'user-1', trigger_type: 'new-proposal', is_active: true, updated_at: new Date().toISOString() },
        { user_id: 'user-1', trigger_type: 'vote-confirmation', is_active: false, updated_at: new Date().toISOString() },
      ];

      prefsRepo.findByUser.mockResolvedValueOnce(mockPrefs);

      const result = await settingsService.getUserPreferences('user-1');

      expect(result).toEqual(mockPrefs);
      expect(prefsRepo.findByUser).toHaveBeenCalledWith('user-1');
    });

    test('returns empty array for user with no preferences', async () => {
      prefsRepo.findByUser.mockResolvedValueOnce([]);

      const result = await settingsService.getUserPreferences('unknown-user');

      expect(result).toEqual([]);
      expect(prefsRepo.findByUser).toHaveBeenCalledWith('unknown-user');
    });
  });

  describe('saveUserPreferences', () => {
    test('calls upsertMany with correct data for valid preferences', async () => {
      prefsRepo.upsertMany.mockResolvedValueOnce(undefined);

      const preferences = [
        { trigger_type: 'new-proposal', is_active: true },
        { trigger_type: 'vote-confirmation', is_active: false },
      ];

      await settingsService.saveUserPreferences('user-1', preferences);

      expect(prefsRepo.upsertMany).toHaveBeenCalledWith('user-1', preferences);
    });

    test('throws on invalid trigger_type not in NOTIFICATION_TYPES', async () => {
      const preferences = [
        { trigger_type: 'invalid-trigger', is_active: true },
      ];

      await expect(settingsService.saveUserPreferences('user-1', preferences)).rejects.toThrow(
        'Unknown trigger types: invalid-trigger'
      );

      expect(prefsRepo.upsertMany).not.toHaveBeenCalled();
    });

    test('throws when multiple invalid trigger_types are provided', async () => {
      const preferences = [
        { trigger_type: 'new-proposal', is_active: true },
        { trigger_type: 'bad-trigger-1', is_active: false },
        { trigger_type: 'bad-trigger-2', is_active: true },
      ];

      await expect(settingsService.saveUserPreferences('user-1', preferences)).rejects.toThrow(
        'Unknown trigger types: bad-trigger-1, bad-trigger-2'
      );

      expect(prefsRepo.upsertMany).not.toHaveBeenCalled();
    });

    test('accepts all valid trigger_types from NOTIFICATION_TYPES', async () => {
      prefsRepo.upsertMany.mockResolvedValueOnce(undefined);

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

      await expect(settingsService.saveUserPreferences('user-1', validPreferences)).resolves.toBeUndefined();

      expect(prefsRepo.upsertMany).toHaveBeenCalledWith('user-1', validPreferences);
    });

    test('throws on empty string trigger_type', async () => {
      const preferences = [
        { trigger_type: '', is_active: true },
      ];

      await expect(settingsService.saveUserPreferences('user-1', preferences)).rejects.toThrow(
        'Unknown trigger types: '
      );

      expect(prefsRepo.upsertMany).not.toHaveBeenCalled();
    });
  });
});
