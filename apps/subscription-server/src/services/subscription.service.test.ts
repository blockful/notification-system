import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { SubscriptionService } from './subscription.service';
import { User, UserPreference, IUserRepository, IPreferenceRepository } from '../interfaces';

// ---- MOCKS ----
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
  created_at: new Date(),
  updated_at: new Date()
};

const mockSubscribers = [
  {
    id: '456',
    user_id: '123',
    dao_id: 'dao123',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    channel: 'telegram',
    channel_user_id: 'user123'
  },
  {
    id: '789',
    user_id: '456',
    dao_id: 'dao123',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    channel: 'discord',
    channel_user_id: 'discord_user_456'
  }
];

// ---- REPOSITORY MOCKS ----
const createMockUserRepo = (): jest.Mocked<IUserRepository> => ({
  findByChannelAndId: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIds: jest.fn(),
  findByIdsWithWorkspaceTokens: jest.fn()
});

const createMockPrefRepo = (): jest.Mocked<IPreferenceRepository> => ({
  findByUserAndDao: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  findByDao: jest.fn()
});

// ---- TESTS ----
describe('Subscription Service', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let prefRepo: jest.Mocked<IPreferenceRepository>;
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo = createMockUserRepo();
    prefRepo = createMockPrefRepo();
    subscriptionService = new SubscriptionService(userRepo, prefRepo);
  });

  describe('handleSubscription', () => {
    test('should create new user and subscription', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(undefined);
      userRepo.create.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(undefined);
      prefRepo.create.mockResolvedValueOnce(mockPreference);

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.user).toEqual(mockUser);
      expect(result.result).toEqual(mockPreference);
    });

    test('should update existing subscription', async () => {
      const updatedPreference = { ...mockPreference, is_active: false };
      
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(mockPreference);
      prefRepo.update.mockResolvedValueOnce(updatedPreference);

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        false
      );

      expect(result.result).toEqual(updatedPreference);
    });

    test('should return existing preference if no change needed', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(mockPreference);

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.result).toEqual(mockPreference);
    });

    test('should create new subscription for existing user', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(undefined);
      prefRepo.create.mockResolvedValueOnce(mockPreference);

      const result = await subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      );

      expect(result.result).toEqual(mockPreference);
    });

    test('should handle error when finding user', async () => {
      userRepo.findByChannelAndId.mockRejectedValueOnce(new Error('DB Error'));

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when creating user', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(undefined);
      userRepo.create.mockRejectedValueOnce(new Error('DB Error'));

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when finding preference', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockRejectedValueOnce(new Error('DB Error'));

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when creating preference', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(undefined);
      prefRepo.create.mockRejectedValueOnce(new Error('DB Error'));

      await expect(subscriptionService.handleSubscription(
        'dao123',
        'telegram',
        'user123',
        true
      )).rejects.toThrow('DB Error');
    });

    test('should handle error when updating preference', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(mockPreference);
      prefRepo.update.mockRejectedValueOnce(new Error('DB Error'));

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
      // Mock preferences
      const mockPreferences = [
        { user_id: '123', is_active: true },
        { user_id: '456', is_active: true }
      ] as UserPreference[];

      // Mock findByIds to return users
      userRepo.findByIds.mockResolvedValueOnce(mockSubscribers);

      prefRepo.findByDao.mockResolvedValueOnce(mockPreferences);

      const result = await subscriptionService.getDaoSubscribers('dao123');

      expect(result.subscribers.length).toBe(2);

      expect(result.subscribers[0]).toHaveProperty('id');
      expect(result.subscribers[0]).toHaveProperty('channel');
      expect(result.subscribers[0]).toHaveProperty('channel_user_id');
      expect(result.subscribers[0]).toHaveProperty('is_active');

      expect(prefRepo.findByDao).toHaveBeenCalledWith('dao123', undefined);
      expect(userRepo.findByIds).toHaveBeenCalledWith(['123', '456']);
    });

    test('should return empty array when no subscribers exist', async () => {
      prefRepo.findByDao.mockResolvedValueOnce([]);
      userRepo.findByIds.mockResolvedValueOnce([]);

      const result = await subscriptionService.getDaoSubscribers('unknown-dao');

      expect(result.subscribers).toEqual([]);
      expect(userRepo.findByIds).toHaveBeenCalledWith([]);
    });
    
    test('should handle errors properly', async () => {
      prefRepo.findByDao.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(subscriptionService.getDaoSubscribers('dao123')).rejects.toThrow('DB Error');
    });
  });
}); 