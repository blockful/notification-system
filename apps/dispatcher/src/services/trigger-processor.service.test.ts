import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TriggerProcessorService } from './trigger-processor.service';
import { NewProposalTriggerHandler } from './triggers/new-proposal-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../interfaces/dispatcher-message.interface';
import { SubscriptionClient } from './subscription-client.service';
import { NotificationClientFactory } from './notification/notification-factory.service';

jest.mock('./triggers/new-proposal-trigger.service');
jest.mock('./subscription-client.service');
jest.mock('./notification/notification-factory.service');
jest.mock('../envConfig', () => ({
  config: {
    subscriptionServerUrl: 'https://subscription.example.com'
  }
}));

const MOCK_MESSAGE_BASE: Omit<DispatcherMessage, 'triggerId'> = {
  events: [{ 
    id: '123',
    daoId: 'test-dao',
    description: 'Test proposal',
    timestamp: new Date().toISOString()
  }]
};

describe('TriggerProcessorService', () => {
  let service: TriggerProcessorService;
  let mockNewProposalHandler: jest.Mocked<NewProposalTriggerHandler>;
  let mockSubscriptionClient: jest.Mocked<SubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockNewProposalHandler = {
      handleMessage: jest.fn()
    } as any;
    mockSubscriptionClient = new SubscriptionClient({} as any) as jest.Mocked<SubscriptionClient>;
    mockNotificationFactory = new NotificationClientFactory() as jest.Mocked<NotificationClientFactory>;
    mockNotificationFactory.addClient = jest.fn();
    mockNotificationFactory.getClient = jest.fn();
    mockNotificationFactory.supportsChannel = jest.fn();
    
    (NewProposalTriggerHandler as jest.Mock).mockImplementation(() => mockNewProposalHandler);
    
    service = new TriggerProcessorService();
    service.addHandler('new-proposal', mockNewProposalHandler);
  });
  
  describe('processTrigger', () => {
    it('should process a message with the correct handler', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        ...MOCK_MESSAGE_BASE
      };
      const mockResult: MessageProcessingResult = {
        messageId: 'processed-123',
        timestamp: new Date().toISOString()
      };
      mockNewProposalHandler.handleMessage.mockResolvedValue(mockResult);
      const result = await service.processTrigger(mockMessage);
      expect(mockNewProposalHandler.handleMessage).toHaveBeenCalledWith(mockMessage);
      expect(result).toStrictEqual(mockResult);
    });

    it('should throw error for unknown trigger', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'unknown-trigger',
        ...MOCK_MESSAGE_BASE
      };
      await expect(service.processTrigger(mockMessage))
        .rejects
        .toThrow('No handler registered for trigger: unknown-trigger');
    });
  });

  describe('addHandler', () => {
    it('should register a handler for a trigger', async () => {
      const newHandler = { handleMessage: jest.fn() } as any;
      const mockResult: MessageProcessingResult = {
        messageId: 'test-result',
        timestamp: new Date().toISOString()
      };
      newHandler.handleMessage.mockResolvedValue(mockResult);
      
      service.addHandler('test-trigger', newHandler);
      
      const mockMessage: DispatcherMessage = {
        triggerId: 'test-trigger',
        ...MOCK_MESSAGE_BASE
      };
      
      const result = await service.processTrigger(mockMessage);
      expect(newHandler.handleMessage).toHaveBeenCalledWith(mockMessage);
      expect(result).toStrictEqual(mockResult);
    });

    it('should register multiple handlers for the same trigger', async () => {
      const handler1 = { handleMessage: jest.fn() } as any;
      const handler2 = { handleMessage: jest.fn() } as any;
      
      handler1.handleMessage.mockResolvedValue({ messageId: 'result1', timestamp: '2023-01-01T10:00:00Z' });
      handler2.handleMessage.mockResolvedValue({ messageId: 'result2', timestamp: '2023-01-01T11:00:00Z' });
      
      service.addHandler('multi-trigger', handler1);
      service.addHandler('multi-trigger', handler2);
      
      const mockMessage: DispatcherMessage = {
        triggerId: 'multi-trigger',
        ...MOCK_MESSAGE_BASE
      };
      
      const result = await service.processTrigger(mockMessage);
      
      // Both handlers should be called
      expect(handler1.handleMessage).toHaveBeenCalledWith(mockMessage);
      expect(handler2.handleMessage).toHaveBeenCalledWith(mockMessage);
      
      // Should return aggregated result
      expect(result.messageId).toBe('result1+result2');
      expect(result.timestamp).toBe('2023-01-01T11:00:00Z'); // Latest timestamp
    });

    it('should log errors but continue when some handlers fail', async () => {
      const handler1 = { handleMessage: jest.fn() } as any;
      const handler2 = { handleMessage: jest.fn() } as any;
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      handler1.handleMessage.mockRejectedValue(new Error('Handler 1 failed'));
      handler2.handleMessage.mockResolvedValue({ messageId: 'result2', timestamp: '2023-01-01T10:00:00Z' });
      
      service.addHandler('failing-trigger', handler1);
      service.addHandler('failing-trigger', handler2);
      
      const mockMessage: DispatcherMessage = {
        triggerId: 'failing-trigger',
        ...MOCK_MESSAGE_BASE
      };
      
      // Should return successful result and log error
      const result = await service.processTrigger(mockMessage);
      expect(result.messageId).toBe('result2');
      expect(result.timestamp).toBe('2023-01-01T10:00:00Z');
      
      // Should log the error
      expect(consoleSpy).toHaveBeenCalledWith(
        '1 handler(s) failed for trigger failing-trigger. Errors:',
        'Handler 1 failed'
      );
      
      // Both handlers should still be called
      expect(handler1.handleMessage).toHaveBeenCalledWith(mockMessage);
      expect(handler2.handleMessage).toHaveBeenCalledWith(mockMessage);
      
      consoleSpy.mockRestore();
    });

    it('should throw error when all handlers fail', async () => {
      const handler1 = { handleMessage: jest.fn() } as any;
      const handler2 = { handleMessage: jest.fn() } as any;
      
      handler1.handleMessage.mockRejectedValue(new Error('Handler 1 failed'));
      handler2.handleMessage.mockRejectedValue(new Error('Handler 2 failed'));
      
      service.addHandler('all-failing-trigger', handler1);
      service.addHandler('all-failing-trigger', handler2);
      
      const mockMessage: DispatcherMessage = {
        triggerId: 'all-failing-trigger',
        ...MOCK_MESSAGE_BASE
      };
      
      // Should throw error when all handlers fail
      await expect(service.processTrigger(mockMessage))
        .rejects
        .toThrow('All handlers failed for trigger all-failing-trigger');
      
      // Both handlers should still be called
      expect(handler1.handleMessage).toHaveBeenCalledWith(mockMessage);
      expect(handler2.handleMessage).toHaveBeenCalledWith(mockMessage);
    });
  });
}); 