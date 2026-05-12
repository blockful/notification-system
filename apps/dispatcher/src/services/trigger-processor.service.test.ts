import { describe, it, expect, beforeEach } from 'vitest';
import { TriggerProcessorService } from './trigger-processor.service';
import { DispatcherMessage, MessageProcessingResult } from '../interfaces/dispatcher-message.interface';
import { TriggerHandler } from '../interfaces/base-trigger.interface';
import { NotificationTypeId } from '@notification-system/messages';

const MOCK_MESSAGE_BASE: Omit<DispatcherMessage, 'triggerId'> = {
  events: [{
    id: '123',
    daoId: 'test-dao',
    description: 'Test proposal',
    timestamp: new Date().toISOString()
  }]
};

class SimpleHandler implements TriggerHandler {
  public calls: DispatcherMessage[] = [];
  public result: MessageProcessingResult = { messageId: '', timestamp: '' };
  public error?: Error;

  async handleMessage(message: DispatcherMessage): Promise<MessageProcessingResult> {
    this.calls.push(message);
    if (this.error) throw this.error;
    return this.result;
  }
}

describe('TriggerProcessorService', () => {
  let service: TriggerProcessorService;
  let simpleHandler: SimpleHandler;

  beforeEach(() => {
    simpleHandler = new SimpleHandler();
    service = new TriggerProcessorService();
    service.addHandler(NotificationTypeId.NewProposal, simpleHandler);
  });

  describe('processTrigger', () => {
    it('should process a message with the correct handler', async () => {
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewProposal,
        ...MOCK_MESSAGE_BASE
      };
      simpleHandler.result = {
        messageId: 'processed-123',
        timestamp: new Date().toISOString()
      };

      const result = await service.processTrigger(message);

      expect(simpleHandler.calls).toEqual([message]);
      expect(result).toStrictEqual(simpleHandler.result);
    });

    it('should return unhandled response for unknown trigger', async () => {
      const message: DispatcherMessage = {
        // @ts-expect-error - testing runtime fallback for an unregistered trigger ID
        triggerId: 'unknown-trigger',
        ...MOCK_MESSAGE_BASE
      };

      const result = await service.processTrigger(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^unhandled-unknown-trigger-\d+$/),
        timestamp: expect.any(String),
      });
    });
  });

  describe('addHandler', () => {
    it('should register a handler for a trigger', async () => {
      const handler = new SimpleHandler();
      handler.result = { messageId: 'test-result', timestamp: new Date().toISOString() };
      service.addHandler('test-trigger', handler);

      const message: DispatcherMessage = {
        // @ts-expect-error - test-only string ID outside NotificationTypeId enum
        triggerId: 'test-trigger',
        ...MOCK_MESSAGE_BASE
      };

      const result = await service.processTrigger(message);

      expect(handler.calls).toEqual([message]);
      expect(result).toStrictEqual(handler.result);
    });

    it('should register multiple handlers for the same trigger', async () => {
      const handler1 = new SimpleHandler();
      const handler2 = new SimpleHandler();
      handler1.result = { messageId: 'result1', timestamp: '2023-01-01T10:00:00Z' };
      handler2.result = { messageId: 'result2', timestamp: '2023-01-01T11:00:00Z' };

      service.addHandler('multi-trigger', handler1);
      service.addHandler('multi-trigger', handler2);

      const message: DispatcherMessage = {
        // @ts-expect-error - test-only string ID outside NotificationTypeId enum
        triggerId: 'multi-trigger',
        ...MOCK_MESSAGE_BASE
      };

      const result = await service.processTrigger(message);

      expect(handler1.calls).toEqual([message]);
      expect(handler2.calls).toEqual([message]);
      expect(result.messageId).toBe('result1+result2');
      expect(result.timestamp).toBe('2023-01-01T11:00:00Z');
    });

    it('should continue when some handlers fail', async () => {
      const handler1 = new SimpleHandler();
      const handler2 = new SimpleHandler();
      handler1.error = new Error('Handler 1 failed');
      handler2.result = { messageId: 'result2', timestamp: '2023-01-01T10:00:00Z' };

      service.addHandler('failing-trigger', handler1);
      service.addHandler('failing-trigger', handler2);

      const message: DispatcherMessage = {
        // @ts-expect-error - test-only string ID outside NotificationTypeId enum
        triggerId: 'failing-trigger',
        ...MOCK_MESSAGE_BASE
      };

      const result = await service.processTrigger(message);

      expect(result.messageId).toBe('result2');
      expect(result.timestamp).toBe('2023-01-01T10:00:00Z');
      expect(handler1.calls).toEqual([message]);
      expect(handler2.calls).toEqual([message]);
    });

    it('should throw error when all handlers fail', async () => {
      const handler1 = new SimpleHandler();
      const handler2 = new SimpleHandler();
      handler1.error = new Error('Handler 1 failed');
      handler2.error = new Error('Handler 2 failed');

      service.addHandler('all-failing-trigger', handler1);
      service.addHandler('all-failing-trigger', handler2);

      const message: DispatcherMessage = {
        // @ts-expect-error - test-only string ID outside NotificationTypeId enum
        triggerId: 'all-failing-trigger',
        ...MOCK_MESSAGE_BASE
      };

      await expect(service.processTrigger(message))
        .rejects
        .toThrow('All handlers failed for trigger all-failing-trigger');

      expect(handler1.calls).toEqual([message]);
      expect(handler2.calls).toEqual([message]);
    });
  });
});
