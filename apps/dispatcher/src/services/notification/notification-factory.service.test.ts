import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotificationClientFactory } from './notification-factory.service';
import { TelegramNotificationClient } from './telegram-notification.service';

jest.mock('./telegram-notification.service', () => ({
  TelegramNotificationClient: jest.fn()
}));

describe('NotificationClientFactory', () => {
  let factory: NotificationClientFactory;
  const telegramBaseUrl = 'https://api.telegram.example.com';
  let mockTelegramClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockTelegramClient = { sendNotification: jest.fn() };
    (TelegramNotificationClient as jest.Mock).mockReturnValue(mockTelegramClient);
    factory = new NotificationClientFactory();
  });
  
  describe('getClient', () => {
    it('should return the correct client for a supported channel', () => {
      factory.addClient('telegram', mockTelegramClient);
      const client = factory.getClient('telegram');
      expect(client).toBe(mockTelegramClient);
    });
    
    it('should throw error for unsupported channel', () => {
      expect(() => factory.getClient('unsupported'))
        .toThrow("Notification client for channel 'unsupported' not found");
    });
  });
  
  describe('addClient', () => {
    it('should add a client to the factory', () => {
      factory.addClient('telegram', mockTelegramClient);
      expect(factory.supportsChannel('telegram')).toBe(true);
    });
  });
  
  describe('supportsChannel', () => {
    it('should return true for supported channels', () => {
      factory.addClient('telegram', mockTelegramClient);
      expect(factory.supportsChannel('telegram')).toBe(true);
    });
    
    it('should return false for unsupported channels', () => {
      expect(factory.supportsChannel('unsupported')).toBe(false);
    });
  });
}); 