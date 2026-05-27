import { describe, test, expect, beforeEach } from 'vitest';
import { NotificationTypeId } from '@notification-system/messages';
import { SettingsService } from './settings.service';
import {
  IUserNotificationPreferencesRepository,
  UserNotificationPreference,
} from '../interfaces/user_subscription.interface';

// ---- SIMPLE DOUBLES ----

const FIXED_DATE = '2025-06-01T00:00:00.000Z';

class SimpleUserNotificationPreferencesRepository implements IUserNotificationPreferencesRepository {
  findByUserResult: UserNotificationPreference[] = [];
  upsertManyCalls: Array<{
    userId: string;
    preferences: { trigger_type: NotificationTypeId; is_active: boolean }[];
  }> = [];

  async findByUser(): Promise<UserNotificationPreference[]> {
    return this.findByUserResult;
  }

  async upsertMany(
    userId: string,
    preferences: { trigger_type: NotificationTypeId; is_active: boolean }[],
  ): Promise<void> {
    this.upsertManyCalls.push({ userId, preferences });
  }

  async filterActiveUsers(): Promise<string[]> {
    return [];
  }
}

// ---- TESTS ----

describe('SettingsService', () => {
  let stub: SimpleUserNotificationPreferencesRepository;
  let settingsService: SettingsService;

  beforeEach(() => {
    stub = new SimpleUserNotificationPreferencesRepository();
    settingsService = new SettingsService(stub);
  });

  describe('getUserPreferences', () => {
    test('returns stored preferences for a user', async () => {
      stub.findByUserResult = [
        { user_id: 'user-1', trigger_type: NotificationTypeId.NewProposal, is_active: true, updated_at: FIXED_DATE },
        { user_id: 'user-1', trigger_type: NotificationTypeId.VoteConfirmation, is_active: false, updated_at: FIXED_DATE },
      ];

      const result = await settingsService.getUserPreferences('user-1');

      expect(result).toEqual([
        { user_id: 'user-1', trigger_type: NotificationTypeId.NewProposal, is_active: true, updated_at: FIXED_DATE },
        { user_id: 'user-1', trigger_type: NotificationTypeId.VoteConfirmation, is_active: false, updated_at: FIXED_DATE },
      ]);
    });

    test('returns empty array for user with no preferences', async () => {
      const result = await settingsService.getUserPreferences('unknown-user');

      expect(result).toEqual([]);
    });

    test('drops rows whose trigger_type is no longer in the current enum', async () => {
      stub.findByUserResult = [
        { user_id: 'user-1', trigger_type: NotificationTypeId.NewProposal, is_active: true, updated_at: FIXED_DATE },
        { user_id: 'user-1', trigger_type: 'offchain-voting-reminder-75' as NotificationTypeId, is_active: false, updated_at: FIXED_DATE },
        { user_id: 'user-1', trigger_type: 'totally-made-up' as NotificationTypeId, is_active: true, updated_at: FIXED_DATE },
      ];

      const result = await settingsService.getUserPreferences('user-1');

      expect(result).toEqual([
        { user_id: 'user-1', trigger_type: NotificationTypeId.NewProposal, is_active: true, updated_at: FIXED_DATE },
      ]);
    });
  });

  describe('saveUserPreferences', () => {
    test('delegates to repository for valid preferences', async () => {
      const preferences = [
        { trigger_type: NotificationTypeId.NewProposal, is_active: true },
        { trigger_type: NotificationTypeId.VoteConfirmation, is_active: false },
      ];

      await settingsService.saveUserPreferences('user-1', preferences);

      expect(stub.upsertManyCalls).toEqual([
        {
          userId: 'user-1',
          preferences: [
            { trigger_type: NotificationTypeId.NewProposal, is_active: true },
            { trigger_type: NotificationTypeId.VoteConfirmation, is_active: false },
          ],
        },
      ]);
    });

    test('accepts all valid trigger_types from NOTIFICATION_TYPES', async () => {
      const validPreferences = [
        { trigger_type: NotificationTypeId.NewProposal, is_active: true },
        { trigger_type: NotificationTypeId.NewOffchainProposal, is_active: true },
        { trigger_type: NotificationTypeId.ProposalFinished, is_active: false },
        { trigger_type: NotificationTypeId.NonVoting, is_active: true },
        { trigger_type: NotificationTypeId.VotingReminder30, is_active: false },
        { trigger_type: NotificationTypeId.VotingReminder60, is_active: true },
        { trigger_type: NotificationTypeId.VotingReminder90, is_active: false },
        { trigger_type: NotificationTypeId.VotingPowerChanged, is_active: true },
        { trigger_type: NotificationTypeId.VoteConfirmation, is_active: true },
        { trigger_type: NotificationTypeId.OffchainVoteCast, is_active: false },
      ];

      await settingsService.saveUserPreferences('user-1', validPreferences);

      expect(stub.upsertManyCalls).toEqual([
        { userId: 'user-1', preferences: validPreferences },
      ]);
    });

});
});
