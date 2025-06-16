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
    subscriptionServerUrl: 'https://subscription.example.com',
    telegramConsumerUrl: 'https://telegram.example.com'
  }
}));

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
        events: [{ 
          id: '123',
          daoId: 'test-dao',
          description: 'Test proposal',
          timestamp: new Date().toISOString()
        }]
      };
      const mockResult: MessageProcessingResult = {
        messageId: 'processed-123',
        timestamp: new Date().toISOString()
      };
      mockNewProposalHandler.handleMessage.mockResolvedValue(mockResult);
      const result = await service.processTrigger(mockMessage);
      expect(mockNewProposalHandler.handleMessage).toHaveBeenCalledWith(mockMessage);
      expect(result).toBe(mockResult);
    });

    it('should throw error for unknown trigger', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'unknown-trigger',
        events: [{ 
          id: '123',
          daoId: 'test-dao',
          description: 'Test proposal',
          timestamp: new Date().toISOString()
        }]
      };
      await expect(service.processTrigger(mockMessage))
        .rejects
        .toThrow('No handler registered for trigger: unknown-trigger');
    });
  });

  describe('addHandler', () => {
    it('should register a handler for a trigger', async () => {
      const newHandler = { handleMessage: jest.fn() } as any;
      service.addHandler('test-trigger', newHandler);
      
      const mockMessage: DispatcherMessage = {
        triggerId: 'test-trigger',
        events: [{ 
          id: '123',
          daoId: 'test-dao',
          description: 'Test proposal',
          timestamp: new Date().toISOString()
        }]
      };
      
      await service.processTrigger(mockMessage);
      expect(newHandler.handleMessage).toHaveBeenCalledWith(mockMessage);
    });
  });
}); 