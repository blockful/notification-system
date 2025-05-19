import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SubscriptionClient } from './subscription-client.service';
import { User } from '../interfaces/subscription-client.interface';

beforeEach(() => {
  jest.resetAllMocks();
});

describe('SubscriptionClient', () => {
  let client: SubscriptionClient;
  const baseUrl = 'https://api.example.com';
  
  beforeEach(() => {
    client = new SubscriptionClient(baseUrl);
  });
  
  describe('getDaoSubscribers', () => {
    it('should fetch subscribers for a DAO successfully', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true },
        { id: '2', channel: 'telegram', channel_user_id: '456', is_active: true }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn<() => Promise<User[]>>().mockResolvedValue(mockUsers)
      };
      // @ts-ignore - mocking fetch for testing
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      const result = await client.getDaoSubscribers('dao123');
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/subscriptions/dao123');
      expect(result).toEqual(mockUsers);
    });
    
    it('should throw error when API request fails', async () => {
      const mockErrorResponse = {
        ok: false,
        statusText: 'Not Found'
      };
      // @ts-ignore - mocking fetch for testing
      global.fetch = jest.fn().mockResolvedValue(mockErrorResponse);
      await expect(client.getDaoSubscribers('dao123'))
        .rejects
        .toThrow('Failed to fetch subscribers: Not Found');
      expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/subscriptions/dao123');
    });
  });
}); 