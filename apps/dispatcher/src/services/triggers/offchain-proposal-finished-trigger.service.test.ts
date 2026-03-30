import { describe, it, expect, beforeEach } from '@jest/globals';
import { OffchainProposalFinishedTriggerHandler } from './offchain-proposal-finished-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient, NotificationPayload } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';

class SimpleSubscriptionClient implements ISubscriptionClient {
  subscribers: Map<string, User[]> = new Map();
  sentNotifications: Notification[] = [];
  lastEventTimestamp?: string;

  async getDaoSubscribers(daoId: string, eventTimestamp?: string): Promise<User[]> {
    this.lastEventTimestamp = eventTimestamp;
    return this.subscribers.get(daoId) || [];
  }

  async shouldSend(subscribers: User[], eventId: string, daoId: string): Promise<Notification[]> {
    return subscribers.map(s => ({ user_id: s.id, event_id: eventId, dao_id: daoId }));
  }

  async shouldSendBatch(): Promise<Notification[][]> { return []; }

  async markAsSent(notifications: Notification[]): Promise<void> {
    this.sentNotifications.push(...notifications);
  }

  async getWalletOwners(): Promise<User[]> { return []; }
  async getWalletOwnersBatch(): Promise<Record<string, User[]>> { return {}; }
  async getFollowedAddresses(): Promise<string[]> { return []; }
}

class SimpleNotificationClient implements INotificationClient {
  sentPayloads: NotificationPayload[] = [];

  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.sentPayloads.push(payload);
  }
}

function createHandler(
  subscriptionClient: SimpleSubscriptionClient,
  notificationClient: SimpleNotificationClient,
) {
  const factory = new NotificationClientFactory();
  factory.addClient('telegram', notificationClient);
  factory.addClient('slack', notificationClient);
  return new OffchainProposalFinishedTriggerHandler(subscriptionClient, factory);
}

describe('OffchainProposalFinishedTriggerHandler', () => {
  let subscriptionClient: SimpleSubscriptionClient;
  let notificationClient: SimpleNotificationClient;
  let handler: OffchainProposalFinishedTriggerHandler;

  const testUser: User = {
    id: 'user-1',
    channel: 'telegram',
    channel_user_id: '123',
    created_at: new Date('2025-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    subscriptionClient = new SimpleSubscriptionClient();
    notificationClient = new SimpleNotificationClient();
    handler = createHandler(subscriptionClient, notificationClient);
  });

  describe('handleMessage', () => {
    it('should produce correct message text with title', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Grant Program',
          created: 1700000000, end: 1700100000, discussion: '',
          link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'closed',
        }],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toEqual([{
        userId: 'user-1',
        channel: 'telegram',
        channelUserId: '123',
        message: '📊 Snapshot proposal "Grant Program" has ended on DAO test-dao',
        metadata: {
          buttons: [{ text: 'View proposal results', url: 'https://snapshot.org/#/test-dao/proposal/snap-1' }],
        },
      }]);
    });

    it('should produce correct message without title', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: '',
          created: 1700000000, end: 1700100000, discussion: '',
          link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'closed',
        }],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toEqual([{
        userId: 'user-1',
        channel: 'telegram',
        channelUserId: '123',
        message: '📊 A Snapshot proposal has ended on DAO test-dao',
        metadata: {
          buttons: [{ text: 'View proposal results', url: 'https://snapshot.org/#/test-dao/proposal/snap-1' }],
        },
      }]);
    });

    it('should set correct eventId as offchain-{proposalId}-finished', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [{
          daoId: 'test-dao', id: 'snap-123', title: 'Test',
          created: 1700000000, end: 1700100000, discussion: '',
          link: 'https://snapshot.org/#/test-dao/proposal/snap-123', state: 'closed',
        }],
      };

      await handler.handleMessage(message);

      expect(subscriptionClient.sentNotifications).toEqual([{
        user_id: 'user-1',
        event_id: 'offchain-snap-123-finished',
        dao_id: 'test-dao',
      }]);
    });

    it('should use end timestamp for subscriber lookup', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, end: 1700100000, discussion: '',
          link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'closed',
        }],
      };

      await handler.handleMessage(message);

      expect(subscriptionClient.lastEventTimestamp).toBe('1700100000');
    });

    it('should include CTA button "View proposal results"', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, end: 1700100000, discussion: '',
          link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'closed',
        }],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toEqual([{
        userId: 'user-1',
        channel: 'telegram',
        channelUserId: '123',
        message: '📊 Snapshot proposal "Test" has ended on DAO test-dao',
        metadata: {
          buttons: [{ text: 'View proposal results', url: 'https://snapshot.org/#/test-dao/proposal/snap-1' }],
        },
      }]);
    });

    it('should process multiple proposals and notify all subscribers', async () => {
      const user2: User = { id: 'user-2', channel: 'telegram', channel_user_id: '456', created_at: new Date('2025-01-01T00:00:00Z') };
      subscriptionClient.subscribers.set('dao-a', [testUser, user2]);
      subscriptionClient.subscribers.set('dao-b', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [
          { daoId: 'dao-a', id: 'snap-1', title: 'Proposal A', created: 1700000000, end: 1700100000, discussion: '', link: 'https://snapshot.org/#/dao-a/proposal/snap-1', state: 'closed' },
          { daoId: 'dao-b', id: 'snap-2', title: 'Proposal B', created: 1700000100, end: 1700100100, discussion: '', link: 'https://snapshot.org/#/dao-b/proposal/snap-2', state: 'closed' },
        ],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toEqual([
        {
          userId: 'user-1', channel: 'telegram', channelUserId: '123',
          message: '📊 Snapshot proposal "Proposal A" has ended on DAO dao-a',
          metadata: { buttons: [{ text: 'View proposal results', url: 'https://snapshot.org/#/dao-a/proposal/snap-1' }] },
        },
        {
          userId: 'user-2', channel: 'telegram', channelUserId: '456',
          message: '📊 Snapshot proposal "Proposal A" has ended on DAO dao-a',
          metadata: { buttons: [{ text: 'View proposal results', url: 'https://snapshot.org/#/dao-a/proposal/snap-1' }] },
        },
        {
          userId: 'user-1', channel: 'telegram', channelUserId: '123',
          message: '📊 Snapshot proposal "Proposal B" has ended on DAO dao-b',
          metadata: { buttons: [{ text: 'View proposal results', url: 'https://snapshot.org/#/dao-b/proposal/snap-2' }] },
        },
      ]);
    });

    it('should not perform lookups when events array is empty', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toEqual([]);
      expect(subscriptionClient.sentNotifications).toEqual([]);
    });

    it('should mark notifications as sent after successful delivery', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: 'offchain-proposal-finished',
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, end: 1700100000, discussion: '',
          link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'closed',
        }],
      };

      await handler.handleMessage(message);

      expect(subscriptionClient.sentNotifications).toEqual([{
        user_id: 'user-1',
        event_id: 'offchain-snap-1-finished',
        dao_id: 'test-dao',
      }]);
    });
  });
});
