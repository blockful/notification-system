import { describe, it, expect } from '@jest/globals';
import { OffchainVoteCastTriggerHandler } from './offchain-vote-cast-trigger.service';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient, NotificationPayload } from '../../interfaces/notification-client.interface';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { offchainVoteCastMessages, replacePlaceholders, NotificationTypeId } from '@notification-system/messages';
import { OffchainVoteWithDaoId } from '@notification-system/anticapture-client';

const STUB_USER: User = {
  id: '1',
  channel: 'telegram',
  channel_user_id: '123',
  created_at: new Date('2025-01-01T00:00:00Z'),
};

class SimpleNotificationClient implements INotificationClient {
  sentPayloads: NotificationPayload[] = [];

  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.sentPayloads.push(payload);
  }
}

class SimpleSubscriptionClient implements ISubscriptionClient {
  subscribers: User[] = [STUB_USER];
  walletOwners: Record<string, User[]> = { '0xvoter123': [STUB_USER] };
  private sentEventIds = new Set<string>();

  async getDaoSubscribers(): Promise<User[]> {
    return this.subscribers;
  }

  async shouldSend(users: User[], eventId: string, daoId: string): Promise<Notification[]> {
    if (this.sentEventIds.has(eventId)) return [];
    return users.map(u => ({ user_id: u.id, event_id: eventId, dao_id: daoId }));
  }

  async shouldSendBatch(): Promise<Notification[][]> {
    return [];
  }

  async markAsSent(notifications: Notification[]): Promise<void> {
    notifications.forEach(n => this.sentEventIds.add(n.event_id));
  }

  async getWalletOwners(): Promise<User[]> {
    return [];
  }

  async getWalletOwnersBatch(): Promise<Record<string, User[]>> {
    return this.walletOwners;
  }

  async getFollowedAddresses(): Promise<string[]> {
    return [];
  }
}

function createHandler(subscriptionClient?: SimpleSubscriptionClient) {
  const notificationClient = new SimpleNotificationClient();
  const sub = subscriptionClient ?? new SimpleSubscriptionClient();

  const factory = new NotificationClientFactory();
  factory.addClient('telegram', notificationClient);

  const handler = new OffchainVoteCastTriggerHandler(sub, factory);

  return { handler, notificationClient, subscriptionClient: sub };
}

function buildExpectedMessage(vote: OffchainVoteWithDaoId): string {
  const hasReason = vote.reason && vote.reason.trim();
  const template = hasReason
    ? offchainVoteCastMessages.withReason
    : offchainVoteCastMessages.withoutReason;

  return replacePlaceholders(template, {
    address: vote.voter,
    daoId: vote.daoId,
    proposalTitle: vote.proposalTitle,
    ...(hasReason && { reason: vote.reason! }),
  });
}

function buildExpectedPayload(vote: OffchainVoteWithDaoId): NotificationPayload {
  return {
    userId: STUB_USER.id,
    channel: STUB_USER.channel,
    channelUserId: STUB_USER.channel_user_id,
    message: buildExpectedMessage(vote),
    bot_token: undefined,
    metadata: undefined,
  };
}

function createVote(overrides?: Partial<OffchainVoteWithDaoId>): OffchainVoteWithDaoId {
  return {
    daoId: 'test-dao',
    proposalId: 'snap-1',
    voter: '0xvoter123',
    created: 1700000000,
    proposalTitle: 'Test Proposal',
    reason: '',
    vp: 100,
    ...overrides,
  };
}

describe('OffchainVoteCastTriggerHandler', () => {
  it('should send one notification per offchain vote', async () => {
    const vote1 = createVote({ proposalId: 'snap-1', proposalTitle: 'Proposal 1' });
    const vote2 = createVote({ proposalId: 'snap-2', proposalTitle: 'Proposal 2', created: 1700000001, vp: 200 });
    const { handler, notificationClient } = createHandler();

    await handler.handleMessage({
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: [vote1, vote2],
    });

    expect(notificationClient.sentPayloads).toEqual([
      buildExpectedPayload(vote1),
      buildExpectedPayload(vote2),
    ]);
  });

  it('should deduplicate - same proposalId+voter not sent twice', async () => {
    const vote = createVote({ proposalId: 'snap-1', proposalTitle: 'Proposal 1' });
    const { handler, notificationClient } = createHandler();

    await handler.handleMessage({
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: [vote],
    });

    const firstPayload = [buildExpectedPayload(vote)];
    expect(notificationClient.sentPayloads).toEqual(firstPayload);

    await handler.handleMessage({
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: [vote],
    });

    expect(notificationClient.sentPayloads).toEqual(firstPayload);
  });

  it('should skip unsubscribed users', async () => {
    const sub = new SimpleSubscriptionClient();
    sub.subscribers = [];
    const { handler, notificationClient } = createHandler(sub);

    await handler.handleMessage({
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: [createVote()],
    });

    expect(notificationClient.sentPayloads).toEqual([]);
  });

  it('should format message with reason when provided', async () => {
    const vote = createVote({
      proposalTitle: 'Treasury Allocation',
      reason: 'Great idea!',
    });
    const { handler, notificationClient } = createHandler();

    await handler.handleMessage({
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: [vote],
    });

    expect(notificationClient.sentPayloads).toEqual([
      buildExpectedPayload(vote),
    ]);
  });

  it('should format message without reason when not provided', async () => {
    const vote = createVote({
      proposalId: 'snap-no-reason',
      proposalTitle: 'Simple Vote',
      reason: '',
      vp: 50,
    });
    const { handler, notificationClient } = createHandler();

    await handler.handleMessage({
      triggerId: NotificationTypeId.OffchainVoteCast,
      events: [vote],
    });

    expect(notificationClient.sentPayloads).toEqual([
      buildExpectedPayload(vote),
    ]);
  });
});
