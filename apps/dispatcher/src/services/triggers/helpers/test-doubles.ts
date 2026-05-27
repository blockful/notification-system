import { ISubscriptionClient, User, Notification } from '../../../interfaces/subscription-client.interface';
import { INotificationClientFactory } from '../../notification/notification-factory.service';
import { INotificationClient, NotificationPayload } from '../../../interfaces/notification-client.interface';
import { DaoInfo, makeAnticaptureClient } from '@notification-system/anticapture-client';

export { makeAnticaptureClient };

export class SimpleSubscriptionClient implements ISubscriptionClient {
  daoSubscribersByDao = new Map<string, User[]>();
  followedAddressesByDao = new Map<string, string[]>();
  walletOwnersByAddress = new Map<string, User[]>();
  shouldSendBehaviour: 'all' | 'none' = 'all';
  markedAsSent: Notification[] = [];

  async getDaoSubscribers(daoId: string): Promise<User[]> {
    return this.daoSubscribersByDao.get(daoId) ?? [];
  }

  async shouldSend(subscribers: User[], eventId: string, daoId: string): Promise<Notification[]> {
    if (this.shouldSendBehaviour === 'none') return [];
    return subscribers.map(u => ({ user_id: u.id, event_id: eventId, dao_id: daoId }));
  }

  async shouldSendBatch(
    requests: Array<{ subscribers: User[]; eventId: string; daoId: string }>,
  ): Promise<Notification[][]> {
    if (this.shouldSendBehaviour === 'none') return requests.map(() => []);
    return requests.map(({ subscribers, eventId, daoId }) =>
      subscribers.map(u => ({ user_id: u.id, event_id: eventId, dao_id: daoId })),
    );
  }

  async markAsSent(notifications: Notification[]): Promise<void> {
    this.markedAsSent.push(...notifications);
  }

  async getWalletOwners(address: string): Promise<User[]> {
    return this.walletOwnersByAddress.get(address) ?? [];
  }

  async getWalletOwnersBatch(addresses: string[]): Promise<Record<string, User[]>> {
    const out: Record<string, User[]> = {};
    for (const a of addresses) out[a] = this.walletOwnersByAddress.get(a) ?? [];
    return out;
  }

  async getFollowedAddresses(daoId: string): Promise<string[]> {
    return this.followedAddressesByDao.get(daoId) ?? [];
  }
}

export class SimpleNotificationClient implements INotificationClient {
  sentPayloads: NotificationPayload[] = [];
  shouldFail = false;
  async sendNotification(payload: NotificationPayload): Promise<void> {
    if (this.shouldFail) throw new Error('notification client failure');
    this.sentPayloads.push(payload);
  }
}

export class SimpleNotificationClientFactory implements INotificationClientFactory {
  client: SimpleNotificationClient;
  constructor() { this.client = new SimpleNotificationClient(); }
  addClient(): void {}
  getClient(): INotificationClient { return this.client; }
  supportsChannel(): boolean { return true; }
}

export function makeDao(overrides: Partial<DaoInfo> = {}): DaoInfo {
  return {
    id: 'test-dao',
    blockTime: 12,
    votingDelay: '1',
    chainId: 1,
    supportsCalldataReview: false,
    supportsOffchainData: false,
    ...overrides,
  };
}
