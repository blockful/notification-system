import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { ProposalFinishedTriggerHandler } from './proposal-finished-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';

describe('ProposalFinishedTriggerHandler', () => {
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockNotificationClient: jest.Mocked<INotificationClient>;
  let handler: ProposalFinishedTriggerHandler;
  let mockUsers: User[];
  let mockNotifications: Notification[];
  let mockProposal: any;
  
  beforeAll(() => {
    mockUsers = [
      { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() },
      { id: '2', channel: 'telegram', channel_user_id: '456', created_at: new Date() }
    ];
    
    mockNotifications = [
      { user_id: '1', event_id: 'prop456-finished', dao_id: 'dao123' },
      { user_id: '2', event_id: 'prop456-finished', dao_id: 'dao123' }
    ];
    
    mockProposal = {
      id: 'prop456',
      daoId: 'dao123',
      description: 'Test Proposal\nDetailed description'
    };
  });
  
  beforeEach(() => {
    mockSubscriptionClient = {
      getDaoSubscribers: jest.fn(),
      shouldSend: jest.fn(),
      markAsSent: jest.fn(),
      getWalletOwners: jest.fn()
    } as jest.Mocked<ISubscriptionClient>;
    
    mockNotificationClient = {
      sendNotification: jest.fn()
    } as jest.Mocked<INotificationClient>;
    
    mockNotificationFactory = {
      addClient: jest.fn(),
      getClient: jest.fn().mockReturnValue(mockNotificationClient),
      supportsChannel: jest.fn().mockReturnValue(true)
    } as any;
    
    mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsers);
    mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotifications);
    mockSubscriptionClient.markAsSent.mockResolvedValue();
    mockNotificationClient.sendNotification.mockResolvedValue();
    
    handler = new ProposalFinishedTriggerHandler(mockSubscriptionClient, mockNotificationFactory);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleMessage', () => {
    it('should process single proposal finished message correctly', async () => {
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [mockProposal]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123', expect.any(String));
      expect(mockSubscriptionClient.shouldSend).toHaveBeenCalledWith(mockUsers, 'prop456-finished', 'dao123');
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: expect.any(String),
        channel: expect.any(String),
        channelUserId: expect.any(String),
        message: 'The proposal "Test Proposal" has ended.'
      }));
    });

    it('should process multiple proposals in a single message', async () => {
      const mockUsersForMultiple: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() }
      ];
      const mockNotificationsForMultiple: Notification[] = [
        { user_id: '1', event_id: 'prop1-finished', dao_id: 'dao123' },
        { user_id: '1', event_id: 'prop2-finished', dao_id: 'dao456' }
      ];
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [
          { id: 'prop1', daoId: 'dao123', description: 'First Proposal' },
          { id: 'prop2', daoId: 'dao456', description: 'Second Proposal' }
        ]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsersForMultiple);
      mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotificationsForMultiple);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledTimes(2);
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123', expect.any(String));
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao456', expect.any(String));
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle empty proposals array', async () => {
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: []
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).not.toHaveBeenCalled();
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should skip proposals with no subscribers', async () => {
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [mockProposal]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue([]);
      mockSubscriptionClient.shouldSend.mockResolvedValue([]);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123', expect.any(String));
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should extract title from multiline descriptions', async () => {
      const mockUsersForMultiline: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() }
      ];
      const mockNotificationsForMultiline: Notification[] = [
        { user_id: '1', event_id: 'prop456-finished', dao_id: 'dao123' }
      ];
      const proposalWithMultilineDesc = {
        id: 'prop456',
        daoId: 'dao123',
        description: 'Main Title\nDetailed description\nMore details'
      };
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [proposalWithMultilineDesc]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsersForMultiline);
      mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotificationsForMultiline);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        message: 'The proposal "Main Title" has ended.'
      }));
    });

    it('should handle markdown headers in descriptions', async () => {
      const mockUsersForMarkdown: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() }
      ];
      const mockNotificationsForMarkdown: Notification[] = [
        { user_id: '1', event_id: 'prop456-finished', dao_id: 'dao123' }
      ];
      const proposalWithMarkdownDesc = {
        id: 'prop456',
        daoId: 'dao123',
        description: '# Markdown Title\nDetailed description'
      };
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [proposalWithMarkdownDesc]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsersForMarkdown);
      mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotificationsForMarkdown);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        message: 'The proposal "Markdown Title" has ended.'
      }));
    });

    it('should handle empty descriptions', async () => {
      const mockUsersForEmpty: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() }
      ];
      const mockNotificationsForEmpty: Notification[] = [
        { user_id: '1', event_id: 'prop456-finished', dao_id: 'dao123' }
      ];
      const proposalWithEmptyDesc = {
        id: 'prop456',
        daoId: 'dao123',
        description: ''
      };
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [proposalWithEmptyDesc]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsersForEmpty);
      mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotificationsForEmpty);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        message: 'A proposal has ended on dao dao123'
      }));
    });

    it('should return correct MessageProcessingResult', async () => {
      const mockMessage: DispatcherMessage<any> = {
        triggerId: 'proposal-finished',
        events: [mockProposal]
      };
      
      const result = await handler.handleMessage(mockMessage);
      
      expect(result).toEqual({
        messageId: 'proposal-finished',
        timestamp: expect.any(String)
      });
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });
});