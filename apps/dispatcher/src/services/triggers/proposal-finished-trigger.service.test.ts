import { describe, it, expect, beforeEach } from 'vitest';
import { ProposalFinishedTriggerHandler } from './proposal-finished-trigger.service';
import { User } from '../../interfaces/subscription-client.interface';
import { ProposalFinishedNotification } from '../../interfaces/notification-client.interface';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { NotificationTypeId } from '@notification-system/messages';
import { SimpleSubscriptionClient, SimpleNotificationClientFactory } from './helpers/test-doubles';

describe('ProposalFinishedTriggerHandler', () => {
  let subscriptionClient: SimpleSubscriptionClient;
  let notificationFactory: SimpleNotificationClientFactory;
  let handler: ProposalFinishedTriggerHandler;

  const userA: User = { id: '1', channel: 'telegram', channel_user_id: '123', created_at: new Date() };
  const userB: User = { id: '2', channel: 'telegram', channel_user_id: '456', created_at: new Date() };

  const baseProposal: ProposalFinishedNotification = {
    id: 'prop456',
    daoId: 'dao123',
    description: 'Test Proposal\nDetailed description',
    endTimestamp: 1625086400,
    status: 'EXECUTED',
    forVotes: '1000000000000000000000',
    againstVotes: '500000000000000000000',
    abstainVotes: '100000000000000000000',
  };

  beforeEach(() => {
    subscriptionClient = new SimpleSubscriptionClient();
    notificationFactory = new SimpleNotificationClientFactory();
    handler = new ProposalFinishedTriggerHandler(subscriptionClient, notificationFactory);
  });

  describe('handleMessage', () => {
    it('should send a finished notification to every DAO subscriber', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA, userB]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [baseProposal],
      });

      expect(notificationFactory.client.sentPayloads).toHaveLength(2);
      const messages = notificationFactory.client.sentPayloads.map(p => p.message);
      expect(messages.every(m => m.includes('Test Proposal'))).toBe(true);
      expect(subscriptionClient.markedAsSent).toEqual([
        { user_id: '1', event_id: 'prop456-finished', dao_id: 'dao123' },
        { user_id: '2', event_id: 'prop456-finished', dao_id: 'dao123' },
      ]);
    });

    it('should process multiple proposals across DAOs in a single message', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);
      subscriptionClient.daoSubscribersByDao.set('dao456', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [
          { ...baseProposal, id: 'prop1', daoId: 'dao123', description: 'First Proposal', endTimestamp: 1625086401, status: 'executed' },
          { ...baseProposal, id: 'prop2', daoId: 'dao456', description: 'Second Proposal', endTimestamp: 1625086402, status: 'defeated', forVotes: '400000000000000000000', againstVotes: '600000000000000000000', abstainVotes: '50000000000000000000' },
        ],
      });

      expect(notificationFactory.client.sentPayloads).toHaveLength(2);
      expect(subscriptionClient.markedAsSent).toEqual([
        { user_id: '1', event_id: 'prop1-finished', dao_id: 'dao123' },
        { user_id: '1', event_id: 'prop2-finished', dao_id: 'dao456' },
      ]);
    });

    it('should not send any notification when proposals array is empty', async () => {
      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [],
      });

      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });

    it('should skip proposals with no DAO subscribers', async () => {
      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [baseProposal],
      });

      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });

    it('should extract title from multiline descriptions', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [{ ...baseProposal, description: 'Main Title\nDetailed description\nMore details' }],
      });

      expect(notificationFactory.client.sentPayloads[0].message).toContain('Main Title');
    });

    it('should handle markdown headers in descriptions', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [{ ...baseProposal, description: '# Markdown Title\nDetailed description', status: 'DEFEATED', forVotes: '400000000000000000000', againstVotes: '600000000000000000000', abstainVotes: '50000000000000000000' }],
      });

      expect(notificationFactory.client.sentPayloads[0].message).toContain('Markdown Title');
    });

    it('should use the title-less template when description is empty', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);

      await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [{ ...baseProposal, description: '', status: 'CANCELED', forVotes: '0', againstVotes: '0', abstainVotes: '0' }],
      });

      expect(notificationFactory.client.sentPayloads[0].message).toContain('A proposal has ended');
    });

    it('should return MessageProcessingResult tagged with the trigger id', async () => {
      subscriptionClient.daoSubscribersByDao.set('dao123', [userA]);

      const result = await handler.handleMessage({
        triggerId: NotificationTypeId.ProposalFinished,
        events: [baseProposal],
      } as DispatcherMessage<ProposalFinishedNotification>);

      expect(result).toEqual({
        messageId: NotificationTypeId.ProposalFinished,
        timestamp: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
    });
  });
});
