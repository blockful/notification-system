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
  
  const mockProposal = {
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
    it('should process single proposal message correctly', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true, created_at: new Date() },
        { id: '2', channel: 'telegram', channel_user_id: '456', is_active: true, created_at: new Date() }
      ];
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        payload: [mockProposal]
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

    it('should process multiple proposals in a single message', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true, created_at: new Date() }
      ];
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        payload: [
          { ...mockProposal, id: 'prop1', daoId: 'dao123', description: 'First Proposal' },
          { ...mockProposal, id: 'prop2', daoId: 'dao456', description: 'Second Proposal' }
        ]
      };
      const mockResponse: NotificationResponse = {
        id: 'notification-id',
        status: 'delivered',
        timestamp: new Date().toISOString()
      };
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsers);
      mockNotificationClient.sendNotification.mockResolvedValue(mockResponse);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledTimes(2);
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao123');
      expect(mockSubscriptionClient.getDaoSubscribers).toHaveBeenCalledWith('dao456');
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(2);
    });

    it('should handle empty payload array', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        payload: []
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getDaoSubscribers).not.toHaveBeenCalled();
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should extract title from multiline descriptions', async () => {
      const mockUsers: User[] = [
        { id: '1', channel: 'telegram', channel_user_id: '123', is_active: true, created_at: new Date() }
      ];
      const proposalWithMultilineDesc = {
        ...mockProposal,
        description: 'Main Title\nDetailed description\nMore details'
      };
      const mockMessage: DispatcherMessage = {
        triggerId: 'new-proposal',
        payload: [proposalWithMultilineDesc]
      };
      const mockResponse: NotificationResponse = {
        id: 'notification-id',
        status: 'delivered',
        timestamp: new Date().toISOString()
      };
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue(mockUsers);
      mockNotificationClient.sendNotification.mockResolvedValue(mockResponse);
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(expect.objectContaining({
        message: 'New proposal in dao123: Main Title',
        metadata: expect.objectContaining({
          proposalTitle: 'Main Title'
        })
      }));
    });
  });
}); 