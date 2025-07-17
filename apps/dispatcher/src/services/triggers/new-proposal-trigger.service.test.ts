import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { NewProposalTriggerHandler } from './new-proposal-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';

describe('NewProposalTriggerHandler', () => {
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockNotificationClient: jest.Mocked<INotificationClient>;
  let handler: NewProposalTriggerHandler;
  let mockUsers: User[];
  let mockNotifications: Notification[];
  let mockProposal: any;
  
  beforeAll(() => {
    mockUsers = [
      { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() },
      { id: '2', channel: 'telegram', channel_user_id: '456', created_at: new Date() }
    ];
    
    mockNotifications = [
      { user_id: '1', event_id: 'prop456', dao_id: 'dao123' },
      { user_id: '2', event_id: 'prop456', dao_id: 'dao123' }
    ];
    
    mockProposal = {
      id: 'prop456',
      daoId: 'dao123',
      proposerAccountId: 'user1',
      targets: ['0x123'],
      values: ['0'],
      signatures: ['vote()'],
      calldatas: ['0x0'],
      startBlock: 100,
      endBlock: 200,
      description: 'Test Proposal\nDetailed description',
      timestamp: '2023-01-01T00:00:00Z',
      status: 'active' as const,
      forVotes: BigInt(100),
      againstVotes: BigInt(50),
      abstainVotes: BigInt(10)
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
    
    handler = new NewProposalTriggerHandler(mockSubscriptionClient, mockNotificationFactory);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('handleMessage', () => {
    it('should process single proposal message correctly', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        events: [mockProposal]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123', '2023-01-01T00:00:00Z');
      expect(mockSubscriptionClient.shouldSend).toHaveBeenCalledWith(mockUsers, 'prop456', 'dao123');
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(2);
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        userId: expect.any(String),
        channel: expect.any(String),
        channelUserId: expect.any(String),
        message: '🗳️ New governance proposal in dao123: "Test Proposal"'
      }));
    });

    it('should process multiple proposals in a single message', async () => {
      const mockUsersForMultiple: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() }
      ];
      const mockNotificationsForMultiple: Notification[] = [
        { user_id: '1', event_id: 'prop1', dao_id: 'dao123' },
        { user_id: '1', event_id: 'prop2', dao_id: 'dao456' }
      ];
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        events: [
          { ...mockProposal, id: 'prop1', daoId: 'dao123', description: 'First Proposal' },
          { ...mockProposal, id: 'prop2', daoId: 'dao456', description: 'Second Proposal' }
        ]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsersForMultiple);
      mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotificationsForMultiple);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledTimes(2);
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123', '2023-01-01T00:00:00Z');
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao456', '2023-01-01T00:00:00Z');
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle empty proposals array', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        events: []
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).not.toHaveBeenCalled();
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should extract title from multiline descriptions', async () => {
      const mockUsersForMultiline: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() }
      ];
      const mockNotificationsForMultiline: Notification[] = [
        { user_id: '1', event_id: 'prop456', dao_id: 'dao123' }
      ];
      const proposalWithMultilineDesc = {
        ...mockProposal,
        description: 'Main Title\nDetailed description\nMore details'
      };
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        events: [proposalWithMultilineDesc]
      };
      
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsersForMultiline);
      mockSubscriptionClient.shouldSend.mockResolvedValue(mockNotificationsForMultiline);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        message: '🗳️ New governance proposal in dao123: "Main Title"'
      }));
    });
  });
}); 