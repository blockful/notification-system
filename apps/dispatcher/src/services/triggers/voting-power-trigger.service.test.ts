import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { VotingPowerTriggerHandler } from './voting-power-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { zeroAddress } from 'viem';

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
      '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': [mockUsers[0]],
      '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB': [mockUsers[1]],
      '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7': [mockUsers[0]]
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
            accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
            accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
            accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            daoId: 'test-dao',
            transactionHash: 'tx123',
            changeType: 'delegation',
            sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
            targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
            delta: '1000'
          }
        ]
      };
      
      await handler.handleMessage(mockMessage);
      
      expect(mockSubscriptionClient.getWalletOwnersBatch).toHaveBeenCalledWith([
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7'
      ]);
    });
  });

  describe('delegation notifications', () => {
    it('should send delegation received notification', async () => {
      const delegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
          message: expect.stringContaining('🥳 {{address}} received a new delegation in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
              delegator: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7'
            })
          })
        })
      );

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('{{delegator}} delegated to {{address}}')
        })
      );
    });

    it('should send new delegation notification when previousDelegate is zero address', async () => {
      const delegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        previousDelegate: zeroAddress,
        newDelegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('✅ Delegation confirmed in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              delegatorAccount: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
              delegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Account {{delegatorAccount}} delegated')
        })
      );
    });

    it('should send delegation changed notification when both previousDelegate and newDelegate are non-zero', async () => {
      const delegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        previousDelegate: '0xOldDelegate12345678901234567890123456789',
        newDelegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [delegationEvent]
      };
      
      await handler.handleMessage(mockMessage);

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('🔄 Delegation changed in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              delegatorAccount: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
              delegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
              previousDelegate: '0xOldDelegate12345678901234567890123456789'
            })
          })
        })
      );

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('changed delegation from {{previousDelegate}} to {{delegate}}')
        })
      );
    });

    it('should send undelegation received notification', async () => {
      const undelegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
          message: expect.stringContaining('🥺 A delegator just undelegated in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
              delegator: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7'
            })
          })
        })
      );

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('removed their delegation from {{address}}')
        })
      );
    });

    it('should send undelegation notification when newDelegate is zero address', async () => {
      const undelegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        delta: '-1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        previousDelegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        newDelegate: zeroAddress
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [undelegationEvent]
      };
      
      await handler.handleMessage(mockMessage);

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('↩️ Undelegation confirmed in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              delegatorAccount: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
              previousDelegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('removed delegation from {{previousDelegate}}')
        })
      );
    });

    it('should skip delegation sent notification when sourceAccountId is missing', async () => {
      const delegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: undefined,
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
          message: expect.stringContaining('🥳 {{address}} received a new delegation')
        })
      );
    });

    it('should include addresses metadata for ENS resolution', async () => {
      const delegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
        targetAccountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        delta: '1000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        previousDelegate: zeroAddress,
        newDelegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
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
              delegator: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7'
            })
          })
        })
      );
      
      // Check delegation sent notification metadata  
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              delegatorAccount: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
              delegate: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );
    });
  });

  describe('transfer notifications', () => {
    it('should send delegator balance change notification when transfer occurs', async () => {
      const userAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const senderAddress = '0xSender1234567890123456789012345678901234';
      const transferEvent = {
        accountId: userAddress,
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'transfer',
        delta: '1000',
        votingPower: '5000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        transfer: {
          from: senderAddress,
          to: userAddress,
          value: '1000'
        }
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [transferEvent]
      };

      await handler.handleMessage(mockMessage);

      // Now uses delegatorBalanceChange notification for all transfers
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('📈 Voting power increased in test-dao!')
        })
      );
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('had their balance increased')
        })
      );
    });

    it('should send notification when delegator balance increases', async () => {
      const userAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      const delegatorAddress = '0x1234567890123456789012345678901234567890';
      const transferEvent = {
        accountId: userAddress, // user is NOT sender/receiver
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'transfer',
        delta: '1000',
        votingPower: '5000',
        chainId: 1,
        timestamp: '2023-01-01T00:00:00Z',
        transfer: {
          from: '0xSomeoneElse',
          to: delegatorAddress, // delegator received tokens
          value: '1000'
        }
      };

      const mockMessage: DispatcherMessage = {
        triggerId: 'voting-power-changed',
        events: [transferEvent]
      };

      await handler.handleMessage(mockMessage);

      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('📈 Voting power increased in test-dao!')
        })
      );
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('who delegates to {{address}}, had their balance increased')
        })
      );
      expect(mockNotificationClient.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: userAddress,
              delegator: delegatorAddress
            })
          })
        })
      );
    });
  });

  describe('other voting power change notifications', () => {
    it('should send generic voting power change notification with delta', async () => {
      const otherEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
          message: expect.stringContaining('⚡ Voting power increased for {{address}} in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );
    });

    it('should send generic voting power change notification without delta', async () => {
      const otherEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
          message: expect.stringContaining('⚡ Voting power increased for {{address}} in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );
    });

    it('should send generic voting power decreased notification', async () => {
      const otherEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'other',
        delta: '-1000',
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
          message: expect.stringContaining('⚡ Voting power decreased for {{address}} in test-dao!'),
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );
    });

    it('should include address in metadata for ENS resolution', async () => {
      const otherEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
          metadata: expect.objectContaining({
            addresses: expect.objectContaining({
              address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
            })
          })
        })
      );
    });
  });

  describe('subscriber filtering and deduplication', () => {
    it('should skip events when no wallet owners found', async () => {
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({});
      
      const delegationEvent = {
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
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
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
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
        accountId: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
        daoId: 'test-dao',
        transactionHash: 'tx123',
        changeType: 'delegation',
        sourceAccountId: '0xEF8305E140ac520225DAf050e2f71d5fBcC543e7',
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