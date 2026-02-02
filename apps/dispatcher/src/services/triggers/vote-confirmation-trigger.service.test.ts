import { describe, it, expect } from '@jest/globals';
import { VoteConfirmationTriggerHandler } from './vote-confirmation-trigger.service';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { NotificationPayload } from '../../interfaces/notification-client.interface';

function createHandler() {
  const sentNotifications: NotificationPayload[] = [];
  const sentEventIds = new Set<string>();
  const stubUser = { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() };

  const handler = new VoteConfirmationTriggerHandler(
    {
      getDaoSubscribers: async () => [stubUser],
      shouldSend: async (users, eventId) => {
        if (sentEventIds.has(eventId)) return [];
        return users.map(u => ({ user_id: u.id, event_id: eventId, dao_id: 'test-dao' }));
      },
      shouldSendBatch: async () => [],
      markAsSent: async (notifications) => {
        notifications.forEach(n => sentEventIds.add(n.event_id));
      },
      getWalletOwners: async () => [],
      getWalletOwnersBatch: async () => ({ '0xVoter123': [stubUser] }),
      getFollowedAddresses: async () => []
    },
    {
      getClient: () => ({ sendNotification: async (n: NotificationPayload) => { sentNotifications.push(n); } }),
      supportsChannel: () => true
    } as unknown as NotificationClientFactory,
    {
      getDAOs: async () => [{ id: 'test-dao', chainId: 1, blockTime: 12, votingDelay: '0' }]
    } as AnticaptureClient
  );

  return { handler, sentNotifications };
}

describe('VoteConfirmationTriggerHandler', () => {
  it('should send one notification per vote in batch voting (same tx, multiple proposals)', async () => {
    const { handler, sentNotifications } = createHandler();

    await handler.handleMessage({
      triggerId: 'vote-confirmation',
      events: [
        { daoId: 'test-dao', proposalId: 'proposal-1', voterAccountId: '0xVoter123', support: 'for', votingPower: '1000000000000000000', timestamp: '2026-01-01T00:00:00Z', txHash: '0xSameTxHash', proposalDescription: 'Proposal 1' },
        { daoId: 'test-dao', proposalId: 'proposal-2', voterAccountId: '0xVoter123', support: 'against', votingPower: '1000000000000000000', timestamp: '2026-01-01T00:00:00Z', txHash: '0xSameTxHash', proposalDescription: 'Proposal 2' },
        { daoId: 'test-dao', proposalId: 'proposal-3', voterAccountId: '0xVoter123', support: 'abstain', votingPower: '1000000000000000000', timestamp: '2026-01-01T00:00:00Z', txHash: '0xSameTxHash', proposalDescription: 'Proposal 3' },
      ]
    });

    expect(sentNotifications).toHaveLength(3);
  });
});
