import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { NewProposalTriggerHandler } from './new-proposal-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { AnticaptureClient } from '@notification-system/anticapture-client';

describe('NewProposalTriggerHandler', () => {
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockNotificationClient: jest.Mocked<INotificationClient>;
  let mockAnticaptureClient: jest.Mocked<AnticaptureClient>;
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
      shouldSendBatch: jest.fn(),
      markAsSent: jest.fn(),
      getWalletOwners: jest.fn(),
      getWalletOwnersBatch: jest.fn(),
      getFollowedAddresses: jest.fn()
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

    mockAnticaptureClient = {
      getDAOs: jest.fn(async () => [
        { id: 'dao123', chainId: 1 },
        { id: 'dao456', chainId: 10 }
      ]),
      getProposalById: jest.fn(),
      listProposals: jest.fn(),
      listVotingPowerHistory: jest.fn(),
      listVotes: jest.fn(),
      listRecentVotesFromAllDaos: jest.fn()
    } as unknown as jest.Mocked<AnticaptureClient>;

    handler = new NewProposalTriggerHandler(mockSubscriptionClient, mockNotificationFactory, mockAnticaptureClient);
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

describe('NewProposalTriggerHandler - cross-DAO eventId deduplication', () => {
  const stubUser1: User = { id: 'user-1', channel: 'telegram', channel_user_id: '111', created_at: new Date() };
  const stubUser2: User = { id: 'user-2', channel: 'telegram', channel_user_id: '222', created_at: new Date() };
  const allUsers = [stubUser1, stubUser2];

  /**
   * Creates a handler with fake dedup that mirrors the real composite key logic:
   *   key = `${user_id}-${dao_id}-${event_id}`
   */
  function createHandlerWithDeduplication() {
    const sentNotifications: { message: string; userId: string }[] = [];
    const sentCompositeKeys = new Set<string>();

    const handler = new NewProposalTriggerHandler(
      {
        getDaoSubscribers: async () => allUsers,
        shouldSend: async (users, eventId, daoId) => {
          return users
            .map(u => ({ user_id: u.id, event_id: eventId, dao_id: daoId }))
            .filter(n => !sentCompositeKeys.has(`${n.user_id}-${n.dao_id}-${n.event_id}`));
        },
        shouldSendBatch: async () => [],
        markAsSent: async (notifications) => {
          notifications.forEach(n => sentCompositeKeys.add(`${n.user_id}-${n.dao_id}-${n.event_id}`));
        },
        getWalletOwners: async () => [],
        getWalletOwnersBatch: async () => ({}),
        getFollowedAddresses: async () => []
      },
      {
        getClient: () => ({
          sendNotification: async (payload: any) => {
            sentNotifications.push({ message: payload.message, userId: payload.userId });
          }
        }),
        supportsChannel: () => true
      } as unknown as NotificationClientFactory,
      {
        getDAOs: async () => [
          { id: 'ens.eth', chainId: 1 },
          { id: 'uniswap.eth', chainId: 1 }
        ],
      } as unknown as AnticaptureClient
    );

    return { handler, sentNotifications, sentCompositeKeys };
  }

  function makeProposal(id: string, daoId: string) {
    return {
      id,
      daoId,
      proposerAccountId: '0xProposer',
      targets: ['0x123'],
      values: ['0'],
      signatures: ['vote()'],
      calldatas: ['0x0'],
      startBlock: 100,
      endBlock: 200,
      description: `Proposal ${id} from ${daoId}`,
      timestamp: '2023-01-01T00:00:00Z',
      status: 'active' as const,
      forVotes: BigInt(0),
      againstVotes: BigInt(0),
      abstainVotes: BigInt(0),
    };
  }

  it('should send notifications for same proposal ID from different DAOs (no cross-DAO collision)', async () => {
    // ENS and UNI both have a proposal with id "5"
    const { handler, sentNotifications } = createHandlerWithDeduplication();

    // First: ENS proposal #5
    await handler.handleMessage({
      triggerId: 'new-proposal',
      events: [makeProposal('5', 'ens.eth')]
    });

    const afterENS = sentNotifications.length;
    expect(afterENS).toBe(2); // 2 users notified

    // Second: UNI proposal #5 (same proposal ID, different DAO)
    await handler.handleMessage({
      triggerId: 'new-proposal',
      events: [makeProposal('5', 'uniswap.eth')]
    });

    // Should ALSO send 2 notifications — no collision with ENS
    expect(sentNotifications.length).toBe(4);
  });

  it('should NOT send duplicate notifications when same DAO + same proposal is processed twice (idempotency)', async () => {
    // Simulates the logic system re-sending the same event (e.g., cursor not advancing)
    const { handler, sentNotifications } = createHandlerWithDeduplication();

    const message: DispatcherMessage = {
      triggerId: 'new-proposal',
      events: [makeProposal('10', 'ens.eth')]
    };

    // First run: should send
    await handler.handleMessage(message);
    expect(sentNotifications.length).toBe(2);

    // Second run (same DAO + same proposal): dedup should block
    await handler.handleMessage(message);
    expect(sentNotifications.length).toBe(2); // no new notifications
  });
}); 