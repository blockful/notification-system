import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { handleSubscription, SUBSCRIPTION_MESSAGES } from './subscription.service';
import { User, Preference } from '../interfaces';
import type { Knex } from 'knex';

// ---- MOCKS ----
const mockUser: User = {
  id: '123',
  channel: 'telegram',
  channel_user_id: 'user123',
  is_active: true
};

const mockPreference: Preference = {
  id: '456',
  user_id: '123',
  dao_id: 'dao123',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
};

const mockLogger = {
  error: jest.fn()
};

const createKnexMock = () => {
  const mock = {
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    returning: jest.fn()
  };

  return jest.fn(() => mock) as unknown as jest.MockedFunction<Knex>;
};

// ---- TESTS ----
describe('Subscription Service', () => {
  let knexMock: jest.MockedFunction<Knex>;
  let knexQueryMock: any;
  let baseSubscriptionArgs: {
    knex: Knex;
    dao: string;
    channel: string;
    channel_user_id: string;
    log: typeof mockLogger;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    knexMock = createKnexMock();
    knexQueryMock = knexMock();
    baseSubscriptionArgs = {
      knex: knexMock as unknown as Knex,
      dao: 'dao123',
      channel: 'telegram',
      channel_user_id: 'user123',
      log: mockLogger
    };
  });

  describe('handleSubscription', () => {
    test('should create new user and subscription', async () => {
      knexQueryMock.returning
        .mockResolvedValueOnce([mockUser]) 
        .mockResolvedValueOnce([mockPreference]); 

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
      
      knexQueryMock.first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockPreference);
      
      knexQueryMock.returning
        .mockResolvedValueOnce([updatedPreference]);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: false
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_DEACTIVATED);
      expect(result.result).toEqual(updatedPreference);
    });

    test('should return already subscribed message if no change needed', async () => {
      knexQueryMock.first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockPreference);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_ALREADY);
      expect(result.result).toEqual(mockPreference);
    });

    test('should create new subscription for existing user', async () => {
      knexQueryMock.first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      
      knexQueryMock.returning
        .mockResolvedValueOnce([mockPreference]);

      const result = await handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      });

      expect(result.message).toBe(SUBSCRIPTION_MESSAGES.SUCCESS_NEW_SUB);
      expect(result.result).toEqual(mockPreference);
    });

    test('should handle database error when querying user', async () => {
      knexQueryMock.first
        .mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      })).rejects.toThrow(SUBSCRIPTION_MESSAGES.ERROR_QUERY_USER);

      expect(mockLogger.error).toHaveBeenCalled();
    });

    test('should handle database error when creating user', async () => {
      knexQueryMock.first
        .mockResolvedValueOnce(null);
      
      knexQueryMock.returning
        .mockRejectedValueOnce(new Error('DB Error'));

      await expect(handleSubscription({
        ...baseSubscriptionArgs,
        is_active: true
      })).rejects.toThrow(SUBSCRIPTION_MESSAGES.ERROR_CREATE_USER);

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
}); 