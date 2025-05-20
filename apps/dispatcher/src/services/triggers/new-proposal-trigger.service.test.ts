import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NewProposalTriggerHandler } from './new-proposal-trigger.service';
import { ISubscriptionClient, User } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient, NotificationResponse } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';

describe('NewProposalTriggerHandler', () => {
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockNotificationClient: jest.Mocked<INotificationClient>;
  let handler: NewProposalTriggerHandler;
  
  beforeEach(() => {
    mockSubscriptionClient = {
      getDaoSubscribers: jest.fn()
    } as any;
    mockNotificationClient = {
      sendNotification: jest.fn()
    } as any;
    mockNotificationFactory = {
      getClient: jest.fn().mockReturnValue(mockNotificationClient),
      supportsChannel: jest.fn().mockReturnValue(true)
    } as any;
    handler = new NewProposalTriggerHandler(mockSubscriptionClient, mockNotificationFactory);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleMessage', () => {
    it('should process new proposal messages correctly', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true, created_at: new Date() },
        { id: '2', channel: 'telegram', channel_user_id: '456', is_active: true, created_at: new Date() }
      ];
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        payload: {
          daoId: 'dao123',
          proposalId: 'prop456',
          proposalTitle: 'Test Proposal'
        }
      };
      const mockResponse: NotificationResponse = {
        id: 'notification-id',
        status: 'delivered',
        timestamp: new Date().toISOString()
      };
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsers);
      mockNotificationClient.sendNotification.mockResolvedValue(mockResponse);
      await handler.handleMessage(mockMessage);
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123');
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: expect.any(String),
        channel: expect.any(String),
        message: 'New proposal in dao123: Test Proposal',
        metadata: {
          daoId: 'dao123',
          proposalId: 'prop456',
          proposalTitle: 'Test Proposal'
        }
      }));
    });
  });
}); 