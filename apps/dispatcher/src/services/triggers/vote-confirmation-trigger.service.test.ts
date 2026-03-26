import { describe, it, expect, jest } from '@jest/globals';
import { VoteConfirmationTriggerHandler } from './vote-confirmation-trigger.service';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { NotificationPayload } from '../../interfaces/notification-client.interface';
import { User } from '../../interfaces/subscription-client.interface';

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
        { daoId: 'test-dao', proposalId: 'proposal-1', voterAddress: '0xVoter123', support: 1, votingPower: '1000000000000000000', timestamp: 1767225600, transactionHash: '0xSameTxHash', proposalTitle: 'Proposal 1' },
        { daoId: 'test-dao', proposalId: 'proposal-2', voterAddress: '0xVoter123', support: 0, votingPower: '1000000000000000000', timestamp: 1767225600, transactionHash: '0xSameTxHash', proposalTitle: 'Proposal 2' },
        { daoId: 'test-dao', proposalId: 'proposal-3', voterAddress: '0xVoter123', support: 2, votingPower: '1000000000000000000', timestamp: 1767225600, transactionHash: '0xSameTxHash', proposalTitle: 'Proposal 3' },
      ]
    });

    expect(sentNotifications).toHaveLength(3);
  });

  it('should pass triggerType "vote-confirmation" to getWalletOwnersBatch and getDaoSubscribers', async () => {
    const stubUser: User = { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() };
    const mockGetWalletOwnersBatch = jest.fn<any>().mockResolvedValue({ '0xVoter123': [stubUser] });
    const mockGetDaoSubscribers = jest.fn<any>().mockResolvedValue([stubUser]);

    const handler = new VoteConfirmationTriggerHandler(
      {
        getDaoSubscribers: mockGetDaoSubscribers,
        shouldSend: async (users: any, eventId: string) => users.map((u: any) => ({ user_id: u.id, event_id: eventId, dao_id: 'test-dao' })),
        shouldSendBatch: async () => [],
        markAsSent: async () => {},
        getWalletOwners: async () => [],
        getWalletOwnersBatch: mockGetWalletOwnersBatch,
        getFollowedAddresses: async () => []
      },
      {
        getClient: () => ({ sendNotification: async () => {} }),
        supportsChannel: () => true
      } as unknown as NotificationClientFactory,
      {
        getDAOs: async () => [{ id: 'test-dao', chainId: 1 }]
      } as AnticaptureClient
    );

    await handler.handleMessage({
      triggerId: 'vote-confirmation',
      events: [{
        daoId: 'test-dao', proposalId: 'proposal-1', voterAddress: '0xVoter123',
        support: 1, votingPower: '1000000000000000000', timestamp: 1767225600,
        transactionHash: '0xTxHash', proposalTitle: 'Proposal 1'
      }]
    });

    expect(mockGetWalletOwnersBatch).toHaveBeenCalledWith(['0xVoter123'], 'vote-confirmation');
    expect(mockGetDaoSubscribers).toHaveBeenCalledWith('test-dao', expect.any(String), 'vote-confirmation');
  });
});
