import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { VotingPowerTriggerHandler } from './voting-power-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';

describe('VotingPowerTriggerHandler', () => {
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockNotificationClient: jest.Mocked<INotificationClient>;
  let handler: VotingPowerTriggerHandler;
  let mockUsers: User[];
  let mockNotifications: Notification[];
  
  beforeAll(() => {
    mockUsers = [
      { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() },
      { id: '2', channel: 'telegram', channel_user_id: '456', created_at: new Date() }
    ];
    
    mockNotifications = [
      { user_id: '1', event_id: 'tx123', dao_id: 'test-dao' },
      { user_id: '2', event_id: 'tx123', dao_id: 'test-dao' }
    ];
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
    mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
      'alice.eth': [mockUsers[0]],
      'bob.eth': [mockUsers[1]],
      'delegator.eth': [mockUsers[0]]
    });
    mockNotificationClient.sendNotification.mockResolvedValue();
    
    handler = new VotingPowerTriggerHandler(mockSubscriptionClient, mockNotificationFactory);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleMessage', () => {
    it('should handle empty events array', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: []
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getWalletOwnersBatch).not.toHaveBeenCalled();
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should filter out invalid events', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [
          // Missing daoId
          {
            accountId: 'alice.eth',
            transactionHash: 'tx123',
            changeType: 'delegation'
          },
          // Missing accountId
          {
            daoId: 'test-dao',
            transactionHash: 'tx123',
            changeType: 'delegation'
          },
          // Missing transactionHash
          {
            accountId: 'alice.eth',
            daoId: 'test-dao',
            changeType: 'delegation'
          }
        ]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getWalletOwnersBatch).not.toHaveBeenCalled();
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should include sourceAccountIds in batch wallet owners lookup', async () => {
      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [
          {
            accountId: 'alice.eth',
            daoId: 'test-dao',
            transactionHash: 'tx123',
            changeType: 'delegation',
            sourceAccountId: 'delegator.eth',
            targetAccountId: 'alice.eth',
            delta: '1000'
          }
        ]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getWalletOwnersBatch).toHaveBeenCalledWith([
        'alice.eth',
        'delegator.eth'
      ]);
    });
  });

  describe('delegation notifications', () => {
    it('should send delegation received notification', async () => {
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        targetAccountId: 'alice.eth',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('🥳 You\'ve received a new delegation in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('{{delegator}} delegated to you')
        })
      );
    });

    it('should send delegation sent notification', async () => {
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        targetAccountId: 'alice.eth',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('✅ Delegation confirmed in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('{{delegatorAccount}} delegated')
        })
      );
    });

    it('should send undelegation received notification', async () => {
      const undelegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        targetAccountId: 'alice.eth',
        delta: '-1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [undelegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('🥺 A delegator just undelegated in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('{{delegator}} removed their delegation')
        })
      );
    });

    it('should send undelegation sent notification', async () => {
      const undelegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        targetAccountId: 'alice.eth',
        delta: '-1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [undelegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('↩️ Undelegation confirmed in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('{{delegatorAccount}} removed')
        })
      );
    });

    it('should handle self-delegation with special message (single notification)', async () => {
      const selfDelegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'alice.eth',
        targetAccountId: 'alice.eth',
        delta: '1000',
        votingPower: '5000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [selfDelegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(1);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('🔄 Self-delegation confirmed in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Your total voting power is now')
        })
      );
    });

    it('should handle self-undelegation with special message (single notification)', async () => {
      const selfUndelegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'alice.eth',
        targetAccountId: 'alice.eth',
        delta: '-1000',
        votingPower: '3000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [selfUndelegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(1);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('🔄 Self-undelegation confirmed in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Your total voting power is now')
        })
      );
    });

    it('should skip delegation sent notification when sourceAccountId is missing', async () => {
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: undefined,
        targetAccountId: 'alice.eth',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      // Should still send delegation received notification
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledTimes(1);
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('🥳 You\'ve received a new delegation')
        })
      );
    });

    it('should include addresses metadata for ENS resolution', async () => {
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        targetAccountId: 'alice.eth',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      // Check delegation received notification metadata
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              delegator: 'delegator.eth'
            })
          })
        })
      );
      
      // Check delegation sent notification metadata  
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              delegatorAccount: 'delegator.eth',
              delegate: 'alice.eth'
            })
          })
        })
      );
    });
  });

  describe('transfer notifications', () => {
    it('should send transfer increase notification', async () => {
      const transferEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'transfer',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [transferEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('📈 Your voting power increased in test-dao!')
        })
      );
    });

    it('should send transfer decrease notification', async () => {
      const transferEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'transfer',
        delta: '-1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [transferEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('📉 Your voting power decreased in test-dao!')
        })
      );
    });
  });

  describe('other voting power change notifications', () => {
    it('should send generic voting power change notification with delta', async () => {
      const otherEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'other',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [otherEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('⚡ Your voting power has changed in test-dao!')
        })
      );
    });

    it('should send generic voting power change notification without delta', async () => {
      const otherEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'other',
        delta: '0',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [otherEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('⚡ Your voting power has changed in test-dao!')
        })
      );
      
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Voting power activity detected.')
        })
      );
    });
  });

  describe('subscriber filtering and deduplication', () => {
    it('should skip events when no wallet owners found', async () => {
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({});
      
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        delta: '1000'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should skip events when no DAO subscribers found', async () => {
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue([]);
      
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        delta: '1000'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });

    it('should skip events when deduplication says not to send', async () => {
      mockSubscriptionClient.shouldSend.mockResolvedValue([]);
      
      const delegationEvent = {
        accountId: 'alice.eth',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: 'delegator.eth',
        delta: '1000'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockNotificationClient.sendNotification).not.toHaveBeenCalled();
    });
  });
});