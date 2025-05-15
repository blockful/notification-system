import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { TriggerProcessorService } from './trigger-processor.service';
import { NewProposalTriggerHandler } from './triggers/new-proposal-trigger.service';
import { DispatcherMessage, MessageProcessingResult } from '../interfaces/dispatcher-message.interface';

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
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockNewProposalHandler = {
      handleMessage: jest.fn()
    } as any;
    (NewProposalTriggerHandler as jest.Mock).mockImplementation(() => mockNewProposalHandler);
    service = new TriggerProcessorService();
  });
  
  describe('processTrigger', () => {
    it('should process a message with the correct handler', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        payload: { id: '123' }
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
        payload: { id: '123' }
      };
      await expect(service.processTrigger(mockMessage))
        .rejects
        .toThrow('No handler registered for trigger: unknown-trigger');
    });
  });
}); 