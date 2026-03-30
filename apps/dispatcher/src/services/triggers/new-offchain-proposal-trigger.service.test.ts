import { describe, it, expect, beforeEach } from '@jest/globals';
import { NewOffchainProposalTriggerHandler } from './new-offchain-proposal-trigger.service';
import { ISubscriptionClient, User, Notification } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { INotificationClient, NotificationPayload } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { NotificationTypeId } from '@notification-system/messages';

class SimpleSubscriptionClient implements ISubscriptionClient {
  subscribers: Map<string, User[]> = new Map();
  sentNotifications: Notification[] = [];

  async getDaoSubscribers(daoId: string): Promise<User[]> {
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
  return new NewOffchainProposalTriggerHandler(subscriptionClient, factory);
}

describe('NewOffchainProposalTriggerHandler', () => {
  let subscriptionClient: SimpleSubscriptionClient;
  let notificationClient: SimpleNotificationClient;
  let handler: NewOffchainProposalTriggerHandler;

  const testUser: User = {
    id: 'user-1',
    channel: 'telegram',
    channel_user_id: '123',
    created_at: new Date(),
  };

  beforeEach(() => {
    subscriptionClient = new SimpleSubscriptionClient();
    notificationClient = new SimpleNotificationClient();
    handler = createHandler(subscriptionClient, notificationClient);
  });

  describe('handleMessage', () => {
    it('should produce correct message text for single proposal', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Grant Program',
          created: 1700000000, discussion: '', link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toHaveLength(1);
      expect(notificationClient.sentPayloads[0].message).toContain("Grant Program");
    });

    it('should use "Untitled Proposal" when title is empty', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: '',
          created: 1700000000, discussion: '', link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads[0].message).toContain('Untitled Proposal');
    });

    it('should set correct eventId as offchain-{proposalId}', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-123', title: 'Test',
          created: 1700000000, discussion: '', link: 'https://snapshot.org/#/test-dao/proposal/snap-123', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      expect(subscriptionClient.sentNotifications[0].event_id).toBe('offchain-snap-123');
    });

    it('should always include CTA button "Cast your vote"', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, discussion: '', link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      const buttons = notificationClient.sentPayloads[0].metadata?.buttons;
      expect(buttons).toBeDefined();
      expect(buttons[0].text).toBe('Cast your vote');
      expect(buttons[0].url).toBe('https://snapshot.org/#/test-dao/proposal/snap-1');
    });

    it('should include "View Discussion" button when discussion URL is provided', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, discussion: 'https://forum.example.com/123', link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      const buttons = notificationClient.sentPayloads[0].metadata?.buttons;
      expect(buttons).toHaveLength(2);
      expect(buttons[1].text).toBe('View Discussion');
      expect(buttons[1].url).toBe('https://forum.example.com/123');
    });

    it('should omit "View Discussion" button when discussion is empty', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, discussion: '', link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      const buttons = notificationClient.sentPayloads[0].metadata?.buttons;
      expect(buttons).toHaveLength(1);
    });

    it('should process multiple proposals and notify all subscribers', async () => {
      const user2: User = { id: 'user-2', channel: 'telegram', channel_user_id: '456', created_at: new Date() };
      subscriptionClient.subscribers.set('dao-a', [testUser, user2]);
      subscriptionClient.subscribers.set('dao-b', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [
          { daoId: 'dao-a', id: 'snap-1', title: 'Proposal A', created: 1700000000, discussion: '', link: 'https://snapshot.org/#/dao-a/proposal/snap-1', state: 'active' },
          { daoId: 'dao-b', id: 'snap-2', title: 'Proposal B', created: 1700000100, discussion: '', link: 'https://snapshot.org/#/dao-b/proposal/snap-2', state: 'active' },
        ],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toHaveLength(3);
    });

    it('should not perform lookups when events array is empty', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [],
      };

      await handler.handleMessage(message);

      expect(notificationClient.sentPayloads).toHaveLength(0);
      expect(subscriptionClient.sentNotifications).toHaveLength(0);
    });

    it('should mark notifications as sent after successful delivery', async () => {
      subscriptionClient.subscribers.set('test-dao', [testUser]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.NewOffchainProposal,
        events: [{
          daoId: 'test-dao', id: 'snap-1', title: 'Test',
          created: 1700000000, discussion: '', link: 'https://snapshot.org/#/test-dao/proposal/snap-1', state: 'active',
        }],
      };

      await handler.handleMessage(message);

      expect(subscriptionClient.sentNotifications).toHaveLength(1);
      expect(subscriptionClient.sentNotifications[0]).toEqual({
        user_id: 'user-1',
        event_id: 'offchain-snap-1',
        dao_id: 'test-dao',
      });
    });
  });
});
