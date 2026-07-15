import { describe, test, expect, beforeEach } from 'vitest';
import type { NotificationTypeId } from '@notification-system/messages';
import { SubscriptionService } from './subscription.service';
import { CryptoUtil } from '../utils/crypto';
import { User, UserPreference } from '../interfaces';
import {
  SimpleUserRepository,
  SimplePreferenceRepository,
  SimpleUserAddressRepository,
  SimpleUserNotificationPreferencesRepository,
} from './test-doubles';

const TEST_ENCRYPTION_KEY = '0'.repeat(64);

// ---- FIXTURES ----
const mockUser: User = {
  id: '123',
  channel: 'telegram',
  channel_user_id: 'user123'
};

const mockPreference: UserPreference = {
  id: '456',
  user_id: '123',
  dao_id: 'dao123',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockSubscribers: User[] = [
  {
    id: '123',
    channel: 'telegram',
    channel_user_id: 'user123'
  },
  {
    id: '456',
    channel: 'discord',
    channel_user_id: 'discord_user_456'
  }
];

// ---- TESTS ----
describe('Subscription Service', () => {
  let userRepo: SimpleUserRepository;
  let prefRepo: SimplePreferenceRepository;
  let userAddressRepo: SimpleUserAddressRepository;
  let notificationPrefsRepo: SimpleUserNotificationPreferencesRepository;
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    userRepo = new SimpleUserRepository();
    prefRepo = new SimplePreferenceRepository();
    userAddressRepo = new SimpleUserAddressRepository();
    notificationPrefsRepo = new SimpleUserNotificationPreferencesRepository();
    subscriptionService = new SubscriptionService(userRepo, prefRepo, userAddressRepo, notificationPrefsRepo, TEST_ENCRYPTION_KEY);
  });

  describe('handleSubscription', () => {
    test('should create new user and subscription', async () => {
      userRepo.findByChannelAndIdResult = undefined;
      userRepo.createResult = mockUser;
      prefRepo.findByUserAndDaoResult = undefined;
      prefRepo.createResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.user).toEqual(mockUser);
      expect(result.result).toEqual(mockPreference);
    });

    test('should generate and return a plaintext secret when creating a new webhook user', async () => {
      const mockWebhookUser: User = { id: '789', channel: 'webhook', channel_user_id: 'webhook_user_1' };
      userRepo.findByChannelAndIdResult = undefined;
      userRepo.createResult = mockWebhookUser;
      prefRepo.findByUserAndDaoResult = undefined;
      prefRepo.createResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'webhook',
        'webhook_user_1',
        true
      );

      expect(result.secret).toBeDefined();
      expect(result.secret).toMatch(/^[0-9a-f]{64}$/);

      expect(userRepo.createCalls).toHaveLength(1);
      const storedSecret = userRepo.createCalls[0].secret;
      expect(storedSecret).toBeDefined();
      expect(storedSecret).not.toBe(result.secret);
      expect(CryptoUtil.decrypt(storedSecret!, TEST_ENCRYPTION_KEY)).toBe(result.secret);
    });

    test('should not generate a secret for a new non-webhook user', async () => {
      userRepo.findByChannelAndIdResult = undefined;
      userRepo.createResult = mockUser;
      prefRepo.findByUserAndDaoResult = undefined;
      prefRepo.createResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.secret).toBeUndefined();
      expect(userRepo.createCalls[0].secret).toBeUndefined();
    });

    test('should not return a locally-generated secret when a concurrent request wins the race', async () => {
      // Simulate: onConflict(...).merge(['channel','channel_user_id']) means a concurrent
      // insert never raises a duplicate-key error - Postgres just returns the row that
      // actually won. Model that by having create() return a persisted secret different
      // from whatever this call encrypts (encryption is non-deterministic via a random IV,
      // so any fixed encrypted value here will never equal what this call computes).
      const winningEncryptedSecret = CryptoUtil.encrypt('someone-elses-raw-secret', TEST_ENCRYPTION_KEY);
      const mockWebhookUser: User = { id: '789', channel: 'webhook', channel_user_id: 'webhook_user_1' };
      userRepo.findByChannelAndIdResult = undefined;
      userRepo.createResult = mockWebhookUser;
      userRepo.createRaceWinnerSecret = winningEncryptedSecret;
      prefRepo.findByUserAndDaoResult = undefined;
      prefRepo.createResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'webhook',
        'webhook_user_1',
        true
      );

      expect(result.secret).toBeUndefined();
    });

    test('should not generate a secret when an existing webhook user is found', async () => {
      const mockWebhookUser: User = { id: '789', channel: 'webhook', channel_user_id: 'webhook_user_1' };
      userRepo.findByChannelAndIdResult = mockWebhookUser;
      prefRepo.findByUserAndDaoResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'webhook',
        'webhook_user_1',
        true
      );

      expect(result.secret).toBeUndefined();
      expect(userRepo.createCalls).toHaveLength(0);
    });

    test('should update existing subscription', async () => {
      const updatedPreference = { ...mockPreference, is_active: false };

      userRepo.findByChannelAndIdResult = mockUser;
      prefRepo.findByUserAndDaoResult = mockPreference;
      prefRepo.updateResult = updatedPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        false
      );

      expect(result.result).toEqual(updatedPreference);
    });

    test('should return existing preference if no change needed', async () => {
      userRepo.findByChannelAndIdResult = mockUser;
      prefRepo.findByUserAndDaoResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.result).toEqual(mockPreference);
    });

    test('should create new subscription for existing user', async () => {
      userRepo.findByChannelAndIdResult = mockUser;
      prefRepo.findByUserAndDaoResult = undefined;
      prefRepo.createResult = mockPreference;

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.result).toEqual(mockPreference);
    });

    test('should handle error when finding user', async () => {
      userRepo.findByChannelAndIdError = new Error('DB Error');

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when creating user', async () => {
      userRepo.findByChannelAndIdResult = undefined;
      userRepo.createError = new Error('DB Error');

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when finding preference', async () => {
      userRepo.findByChannelAndIdResult = mockUser;
      prefRepo.findByUserAndDaoError = new Error('DB Error');

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when creating preference', async () => {
      userRepo.findByChannelAndIdResult = mockUser;
      prefRepo.findByUserAndDaoResult = undefined;
      prefRepo.createError = new Error('DB Error');

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when updating preference', async () => {
      userRepo.findByChannelAndIdResult = mockUser;
      prefRepo.findByUserAndDaoResult = mockPreference;
      prefRepo.updateError = new Error('DB Error');

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        false
      )).rejects.toThrow('DB Error');
    });
  });

  describe('getDaoSubscribers', () => {
    test('should retrieve and format subscribers for a DAO', async () => {
      const mockPreferences = [
        { user_id: '123', is_active: true },
        { user_id: '456', is_active: true }
      ] as UserPreference[];

      userRepo.findByIdsWithWorkspaceTokensResult = mockSubscribers;
      prefRepo.findByDaoResult = mockPreferences;

      const result = await subscriptionService.getDaoSubscribers('dao123');

      expect(result.subscribers.length).toBe(2);

      expect(result.subscribers[0]).toHaveProperty('id');
      expect(result.subscribers[0]).toHaveProperty('channel');
      expect(result.subscribers[0]).toHaveProperty('channel_user_id');

      expect(prefRepo.findByDaoCalls).toEqual([{ daoId: 'dao123', eventTimestamp: undefined }]);
      expect(userRepo.findByIdsWithWorkspaceTokensCalls).toEqual([['123', '456']]);
    });

    test('should return empty array when no subscribers exist', async () => {
      prefRepo.findByDaoResult = [];
      userRepo.findByIdsWithWorkspaceTokensResult = [];

      const result = await subscriptionService.getDaoSubscribers('unknown-dao');

      expect(result.subscribers).toEqual([]);
      expect(userRepo.findByIdsWithWorkspaceTokensCalls).toEqual([[]]);
    });

    test('should handle errors properly', async () => {
      prefRepo.findByDaoError = new Error('DB Error');

      await expect(subscriptionService.getDaoSubscribers('dao123')).rejects.toThrow('DB Error');
    });

    test('should filter subscribers by triggerType when provided', async () => {
      const mockPreferences = [
        { user_id: '123', is_active: true },
        { user_id: '456', is_active: true }
      ] as UserPreference[];

      prefRepo.findByDaoResult = mockPreferences;
      notificationPrefsRepo.filterActiveUsersResult = ['123'];
      userRepo.findByIdsWithWorkspaceTokensResult = [mockSubscribers[0]];

      const result = await subscriptionService.getDaoSubscribers('dao123', undefined, 'PROPOSAL_CREATED' as NotificationTypeId);

      expect(notificationPrefsRepo.filterActiveUsersCalls).toEqual([
        { userIds: ['123', '456'], triggerType: 'PROPOSAL_CREATED' as NotificationTypeId },
      ]);
      expect(userRepo.findByIdsWithWorkspaceTokensCalls).toEqual([['123']]);
      expect(result.subscribers.length).toBe(1);
    });
  });
});
