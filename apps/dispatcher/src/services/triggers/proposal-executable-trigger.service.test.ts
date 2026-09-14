import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationTypeId } from '@notification-system/messages';
import { ProposalExecutableTriggerHandler } from './proposal-executable-trigger.service';
import { User } from '../../interfaces/subscription-client.interface';
import { SimpleSubscriptionClient, SimpleNotificationClientFactory } from './helpers/test-doubles';

describe('ProposalExecutableTriggerHandler', () => {
  let subscriptionClient: SimpleSubscriptionClient;
  let notificationFactory: SimpleNotificationClientFactory;
  let handler: ProposalExecutableTriggerHandler;

  const webhookUser: User = { id: 'w1', channel: 'webhook', channel_user_id: 'http://relayer.railway.internal:3002/relay/webhook', created_at: new Date(), token: 'secret' };
  const telegramUser: User = { id: 't1', channel: 'telegram', channel_user_id: '123', created_at: new Date() };

  const event = { id: '42', daoId: 'ens', status: 'PENDING_EXECUTION', endTimestamp: 1_700_000_000 };

  beforeEach(() => {
    subscriptionClient = new SimpleSubscriptionClient();
    notificationFactory = new SimpleNotificationClientFactory();
    handler = new ProposalExecutableTriggerHandler(subscriptionClient, notificationFactory);
  });

  it('delivers to webhook subscribers only, with proposal identity in metadata', async () => {
    subscriptionClient.daoSubscribersByDao.set('ens', [webhookUser, telegramUser]);

    await handler.handleMessage({ triggerId: NotificationTypeId.ProposalExecutable, events: [event] });

    expect(notificationFactory.client.sentPayloads).toHaveLength(1);
    const payload = notificationFactory.client.sentPayloads[0];
    expect(payload.channel).toBe('webhook');
    expect(payload.metadata).toEqual({
      triggerType: 'proposalExecutable',
      daoId: 'ens',
      proposalId: '42',
      status: 'PENDING_EXECUTION',
    });
    expect(subscriptionClient.markedAsSent).toEqual([
      { user_id: 'w1', event_id: '42-executable', dao_id: 'ens' },
    ]);
  });

  it('sends nothing when the DAO has no webhook subscribers', async () => {
    subscriptionClient.daoSubscribersByDao.set('ens', [telegramUser]);

    await handler.handleMessage({ triggerId: NotificationTypeId.ProposalExecutable, events: [event] });

    expect(notificationFactory.client.sentPayloads).toEqual([]);
    expect(subscriptionClient.markedAsSent).toEqual([]);
  });

  it('handles an empty batch', async () => {
    await handler.handleMessage({ triggerId: NotificationTypeId.ProposalExecutable, events: [] });
    expect(notificationFactory.client.sentPayloads).toEqual([]);
  });
});
