import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { handleSubscription, SUBSCRIPTION_MESSAGES } from './subscription.service';
import { User, UserPreference, IUserRepository, IPreferenceRepository, Logger } from '../interfaces';

// ---- MOCKS ----
const mockUser: User = {
  id: '123',
  channel: 'telegram',
  channel_user_id: 'user123',
  is_active: true
};

const mockPreference: UserPreference = {
  id: '456',
  user_id: '123',
  dao_id: 'dao123',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const mockLogger: Logger = {
  error: jest.fn()
};

// ---- REPOSITORY MOCKS ----
const createMockUserRepo = (): jest.Mocked<IUserRepository> => ({
  findByChannelAndId: jest.fn(),
  create: jest.fn()
});

const createMockPrefRepo = (): jest.Mocked<IPreferenceRepository> => ({
  findByUserAndDao: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
});

// ---- TESTS ----
describe('Subscription Service', () => {
  let userRepo: jest.Mocked<IUserRepository>;
  let prefRepo: jest.Mocked<IPreferenceRepository>;
  let baseSubscriptionArgs: {
    userRepo: IUserRepository;
    prefRepo: IPreferenceRepository;
    dao: string;
    channel: string;
    channel_user_id: string;
    log: Logger;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    userRepo = createMockUserRepo();
    prefRepo = createMockPrefRepo();
    baseSubscriptionArgs = {
      userRepo,
      prefRepo,
      dao: 'dao123',
      channel: 'telegram',
      channel_user_id: 'user123',
      log: mockLogger
    };
  });

  describe('handleSubscription', () => {
    test('should create new user and subscription', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(undefined);
      userRepo.create.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(undefined);
      prefRepo.create.mockResolvedValueOnce(mockPreference);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB);
      expect(result.user).toEqual(mockUser);
      expect(result.result).toEqual(mockPreference);
    });

    test('should update existing subscription', async () => {
      const updatedPreference = { ...mockPreference, is_active: false };
      
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(mockPreference);
      prefRepo.update.mockResolvedValueOnce(updatedPreference);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: false
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_DEACTIVATED);
      expect(result.result).toEqual(updatedPreference);
    });

    test('should return already subscribed message if no change needed', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(mockPreference);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_ALREADY);
      expect(result.result).toEqual(mockPreference);
    });

    test('should create new subscription for existing user', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(undefined);
      prefRepo.create.mockResolvedValueOnce(mockPreference);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB);
      expect(result.result).toEqual(mockPreference);
    });

    test('should handle error when finding user', async () => {
      userRepo.findByChannelAndId.mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      })).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle error when creating user', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(undefined);
      userRepo.create.mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      })).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle error when finding preference', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      })).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle error when creating preference', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(undefined);
      prefRepo.create.mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      })).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle error when updating preference', async () => {
      userRepo.findByChannelAndId.mockResolvedValueOnce(mockUser);
      prefRepo.findByUserAndDao.mockResolvedValueOnce(mockPreference);
      prefRepo.update.mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: false
      })).rejects.toThrow('DB Error');

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 