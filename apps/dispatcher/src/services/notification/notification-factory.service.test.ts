import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotificationClientFactory } from './notification-factory.service';
import { RabbitMQNotificationService } from './rabbitmq-notification.service';

jest.mock('./rabbitmq-notification.service', () => ({
  RabbitMQNotificationService: jest.fn()
}));

describe('NotificationClientFactory', () => {
  let factory: NotificationClientFactory;
  let mockRabbitMQClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockRabbitMQClient = { sendNotification: jest.fn() };
    jest.mocked(RabbitMQNotificationService).mockReturnValue(mockRabbitMQClient);
    factory = new NotificationClientFactory();
  });
  
  describe('getClient', () => {
    it('should return the correct client for a supported channel', () => {
      factory.addClient('telegram', mockRabbitMQClient);
      const client = factory.getClient('telegram');
      expect(client).toBe(mockRabbitMQClient);
    });
    
    it('should throw error for unsupported channel', () => {
      expect(() => factory.getClient('unsupported'))
        .toThrow("Notification client for channel 'unsupported' not found");
    });
  });
  
  describe('addClient', () => {
    it('should add a client to the factory', () => {
      factory.addClient('telegram', mockRabbitMQClient);
      expect(factory.supportsChannel('telegram')).toBe(true);
    });
  });
  
  describe('supportsChannel', () => {
    it('should return true for supported channels', () => {
      factory.addClient('telegram', mockRabbitMQClient);
      expect(factory.supportsChannel('telegram')).toBe(true);
    });
    
    it('should return false for unsupported channels', () => {
      expect(factory.supportsChannel('unsupported')).toBe(false);
    });
  });
}); 