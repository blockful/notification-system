import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { SubscriptionClient } from './subscription-client.service';
import { User, Notification } from '../interfaces/subscription-client.interface';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn()
} as any;

describe('SubscriptionClient', () => {
  let client: SubscriptionClient;
  const baseUrl = 'https://api.example.com';
  
  beforeEach(() => {
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    client = new SubscriptionClient(baseUrl);
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('getDaoSubscribers', () => {
    it('should fetch subscribers for a DAO successfully', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true, created_at: new Date() },
        { id: '2', channel: 'telegram', channel_user_id: '456', is_active: true, created_at: new Date() }
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockUsers });
      const result = await client.getDaoSubscribers('dao123');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/subscriptions/dao123');
      expect(result).toEqual(mockUsers);
    });
    
    it('should throw error when API request fails', async () => {
      const error = new Error('Request failed');
      mockAxiosInstance.get.mockRejectedValue(error);
      await expect(client.getDaoSubscribers('dao123'))
        .rejects
        .toThrow('Request failed');
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/subscriptions/dao123');
    });
  });

  describe('shouldSend', () => {
    it('should filter subscribers correctly', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true, created_at: new Date() }
      ];
      const mockNotifications: Notification[] = [
        { user_id: '1', event_id: 'prop123', dao_id: 'dao123' }
      ];
      mockAxiosInstance.post.mockResolvedValue({ data: mockNotifications });
      const result = await client.shouldSend(mockUsers, 'prop123', 'dao123');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/notifications/should-send', {
        notifications: [{ user_id: '1', event_id: 'prop123', dao_id: 'dao123' }]
      });
      expect(result).toEqual(mockNotifications);
    });
  });

  describe('markAsSent', () => {
    it('should mark notifications as sent successfully', async () => {
      const mockNotifications: Notification[] = [
        { user_id: '1', event_id: 'prop123', dao_id: 'dao123' }
      ];
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });
      await client.markAsSent(mockNotifications);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/notifications/mark-sent', {
        notifications: mockNotifications
      });
    });
  });
}); 