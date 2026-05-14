import { describe, it, expect, beforeEach } from 'vitest';
import { NewProposalTriggerHandler } from './new-proposal-trigger.service';
import { User } from '../../interfaces/subscription-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { NotificationTypeId } from '@notification-system/messages';
import {
  SimpleSubscriptionClient,
  SimpleNotificationClientFactory,
  makeDao,
  makeAnticaptureClient,
} from './helpers/test-doubles';

describe('NewProposalTriggerHandler', () => {
  let subscriptionClient: SimpleSubscriptionClient;
  let notificationFactory: SimpleNotificationClientFactory;
  let handler: NewProposalTriggerHandler;

  const userA: User = { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() };
  const userB: User = { id: '2', channel: 'telegram', channel_user_id: '456', created_at: new Date() };

  const baseProposal = {
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
    abstainVotes: BigInt(10),
  };

  const anticaptureClient = makeAnticaptureClient({
    getDAOs: async () => [
      makeDao({ id: 'dao123', alreadySupportCalldataReview: false }),
      makeDao({ id: 'dao456', chainId: 10, alreadySupportCalldataReview: true, supportOffchainData: true }),
    ],
  });

  beforeEach(() => {
    subscriptionClient = new SimpleSubscriptionClient();
    notificationFactory = new SimpleNotificationClientFactory();
    handler = new NewProposalTriggerHandler(subscriptionClient, notificationFactory, anticaptureClient);
  });

  describe('handleMessage', () => {
    it('should send a notification per subscriber with the proposal title in the message', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA, userB]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.NewProposal,
        events: [baseProposal],
      });

      expect(notificationFactory.client.sentPayloads).toHaveLength(2);
      expect(notificationFactory.client.sentPayloads.map(p => p.message)).toEqual([
        '🗳️ New governance proposal in dao123: "Test Proposal"',
        '🗳️ New governance proposal in dao123: "Test Proposal"',
      ]);
      expect(subscriptionClient.markedAsSent).toEqual([
        { user_id: '1', event_id: 'prop456', dao_id: 'dao123' },
        { user_id: '2', event_id: 'prop456', dao_id: 'dao123' },
      ]);
    });

    it('should process multiple proposals across DAOs in a single message', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);
      subscriptionClient.daoSubscribersByDao.set('dao456', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.NewProposal,
        events: [
          { ...baseProposal, id: 'prop1', daoId: 'dao123', description: 'First Proposal' },
          { ...baseProposal, id: 'prop2', daoId: 'dao456', description: 'Second Proposal' },
        ],
      });

      expect(notificationFactory.client.sentPayloads).toHaveLength(2);
      expect(subscriptionClient.markedAsSent).toEqual([
        { user_id: '1', event_id: 'prop1', dao_id: 'dao123' },
        { user_id: '1', event_id: 'prop2', dao_id: 'dao456' },
      ]);
    });

    it('should not send any notification when proposals array is empty', async () => {
      await handler.handleMessage({
        triggerId: NotificationTypeId.NewProposal,
        events: [],
      });

      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });

    it('should include calldata review button when DAO does not support it natively', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.NewProposal,
        events: [baseProposal],
      });

      const calldataMessage = encodeURIComponent(
        "Hi, I'd like to request a call-data review for proposal prop456 in dao123.",
      );
      expect(notificationFactory.client.sentPayloads[0].metadata?.buttons).toEqual([
        [{ text: 'Check proposal details', url: 'https://anticapture.com/dao123/governance/proposal/prop456' }],
        [{ text: '🔎 Request a call-data review', url: `https://t.me/Zeugh?text=${calldataMessage}` }],
      ]);
    });

    it('should NOT include calldata review button when DAO already supports it', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao456', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.NewProposal,
        events: [{ ...baseProposal, id: 'prop789', daoId: 'dao456' }],
      });

      expect(notificationFactory.client.sentPayloads[0].metadata?.buttons).toEqual([
        [{ text: 'Check proposal details', url: 'https://anticapture.com/dao456/governance/proposal/prop789' }],
      ]);
    });

    it('should extract title from multiline descriptions', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.NewProposal,
        events: [{ ...baseProposal, description: 'Main Title\nDetailed description\nMore details' }],
      });

      expect(notificationFactory.client.sentPayloads[0].message).toBe(
        '🗳️ New governance proposal in dao123: "Main Title"',
      );
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
        addClient: () => {},
        getClient: () => ({
          sendNotification: async (payload: any) => {
            sentNotifications.push({ message: payload.message, userId: payload.userId });
          }
        }),
        supportsChannel: () => true
      },
      makeAnticaptureClient({
        getDAOs: async () => [
          { id: 'ens.eth', blockTime: 12, votingDelay: '1', chainId: 1, alreadySupportCalldataReview: true, supportOffchainData: true },
          { id: 'uniswap.eth', blockTime: 12, votingDelay: '1', chainId: 1, alreadySupportCalldataReview: false, supportOffchainData: true }
        ],
      })
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
      triggerId: NotificationTypeId.NewProposal,
      events: [makeProposal('5', 'ens.eth')]
    });

    const afterENS = sentNotifications.length;
    expect(afterENS).toBe(2); // 2 users notified

    // Second: UNI proposal #5 (same proposal ID, different DAO)
    await handler.handleMessage({
      triggerId: NotificationTypeId.NewProposal,
      events: [makeProposal('5', 'uniswap.eth')]
    });

    // Should ALSO send 2 notifications — no collision with ENS
    expect(sentNotifications.length).toBe(4);
  });

  it('should NOT send duplicate notifications when same DAO + same proposal is processed twice (idempotency)', async () => {
    // Simulates the logic system re-sending the same event (e.g., cursor not advancing)
    const { handler, sentNotifications } = createHandlerWithDeduplication();

    const message: DispatcherMessage = {
      triggerId: NotificationTypeId.NewProposal,
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