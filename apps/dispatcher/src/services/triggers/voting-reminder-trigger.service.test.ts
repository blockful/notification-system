import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { VotingReminderTriggerHandler } from './voting-reminder-trigger.service';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { User } from '../../interfaces/subscription-client.interface';
import { FormattingService } from '../formatting.service';
import { NotificationTypeId, votingReminderMessages } from '@notification-system/messages';
import { NonVotersSource, VotingReminderEvent } from '../../interfaces/voting-reminder.interface';
import {
  SimpleSubscriptionClient,
  SimpleNotificationClientFactory,
  makeAnticaptureClient,
} from './helpers/test-doubles';

class FailingSubscriptionClient extends SimpleSubscriptionClient {
  private rejectionsRemaining = 0;

  async getFollowedAddresses(daoId: string): Promise<string[]> {
    if (this.rejectionsRemaining > 0) {
      this.rejectionsRemaining--;
      throw new Error('Network error');
    }
    return super.getFollowedAddresses(daoId);
  }

  rejectFollowedAddressesNTimes(n: number) {
    this.rejectionsRemaining = n;
  }
}

class SimpleNonVotersSource implements NonVotersSource {
  nonVotersByProposal = new Map<string, { voter: string }[]>();
  async getNonVoters(proposalId: string): Promise<{ voter: string }[]> {
    return this.nonVotersByProposal.get(proposalId) ?? [];
  }
}

describe('VotingReminderTriggerHandler', () => {
  let handler: VotingReminderTriggerHandler;
  let subscriptionClient: FailingSubscriptionClient;
  let notificationFactory: SimpleNotificationClientFactory;
  let nonVotersSource: SimpleNonVotersSource;

  const mockUser: User = {
    id: 'user-123',
    channel: 'telegram',
    channel_user_id: 'tg-123',
    created_at: new Date('2024-01-01T00:00:00Z'),
  };

  const mockVotingReminderEvent: VotingReminderEvent = {
    id: 'proposal-123',
    daoId: 'test-dao',
    title: 'Test Proposal',
    description: 'A test proposal for voting reminder',
    startTimestamp: 1000000,
    endTimestamp: 2000000,
    timeElapsedPercentage: 75.5,
    thresholdPercentage: 90,
  };

  beforeEach(() => {
    subscriptionClient = new FailingSubscriptionClient();
    notificationFactory = new SimpleNotificationClientFactory();
    nonVotersSource = new SimpleNonVotersSource();

    handler = new VotingReminderTriggerHandler(
      subscriptionClient,
      notificationFactory,
      makeAnticaptureClient({ getDAOs: async () => [] }),
      nonVotersSource,
      votingReminderMessages,
      'voting-reminder',
    );

    vi.spyOn(Date, 'now').mockReturnValue(1500000 * 1000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleMessage', () => {
    it('should handle empty events array without sending notifications', async () => {
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.VotingReminder90,
        events: [],
      };

      const result = await handler.handleMessage(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^voting-reminder-empty-\d+$/),
        timestamp: expect.any(String),
      });
      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });

    it('should send a notification only to non-voting subscribers', async () => {
      subscriptionClient.followedAddressesByDao.set('test-dao', ['0x123', '0x456']);
      subscriptionClient.walletOwnersByAddress.set('0x456', [mockUser]);
      subscriptionClient.daoSubscribersByDao.set('test-dao', [mockUser]);
      nonVotersSource.nonVotersByProposal.set('proposal-123', [{ voter: '0x456' }]);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.VotingReminder90,
        events: [mockVotingReminderEvent],
      };

      const result = await handler.handleMessage(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^voting-reminder-\d+$/),
        timestamp: expect.any(String),
      });
      expect(notificationFactory.client.sentPayloads).toHaveLength(1);
      expect(notificationFactory.client.sentPayloads[0].userId).toBe(mockUser.id);
      expect(notificationFactory.client.sentPayloads[0].channelUserId).toBe(mockUser.channel_user_id);
      expect(subscriptionClient.markedAsSent).toEqual([
        { user_id: mockUser.id, event_id: 'proposal-123-90-voting-reminder', dao_id: 'test-dao' },
      ]);
    });

    it('should not send any notification when no addresses are subscribed to the DAO', async () => {
      subscriptionClient.followedAddressesByDao.set('test-dao', []);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.VotingReminder90,
        events: [mockVotingReminderEvent],
      };

      const result = await handler.handleMessage(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^voting-reminder-\d+$/),
        timestamp: expect.any(String),
      });
      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });

    it('should not send any notification when all subscribed addresses already voted', async () => {
      subscriptionClient.followedAddressesByDao.set('test-dao', ['0x123']);
      nonVotersSource.nonVotersByProposal.set('proposal-123', []);

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.VotingReminder90,
        events: [mockVotingReminderEvent],
      };

      const result = await handler.handleMessage(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^voting-reminder-\d+$/),
        timestamp: expect.any(String),
      });
      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });

    it('should not send any notification when all users were already notified', async () => {
      subscriptionClient.followedAddressesByDao.set('test-dao', ['0x456']);
      subscriptionClient.walletOwnersByAddress.set('0x456', [mockUser]);
      subscriptionClient.daoSubscribersByDao.set('test-dao', [mockUser]);
      nonVotersSource.nonVotersByProposal.set('proposal-123', [{ voter: '0x456' }]);
      subscriptionClient.shouldSendBehaviour = 'none';

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.VotingReminder90,
        events: [mockVotingReminderEvent],
      };

      const result = await handler.handleMessage(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^voting-reminder-\d+$/),
        timestamp: expect.any(String),
      });
      expect(notificationFactory.client.sentPayloads).toEqual([]);
      expect(subscriptionClient.markedAsSent).toEqual([]);
    });
  });

  describe('message creation', () => {
    const buildExpected = (header: string, title: string, threshold: number, urgency: string) =>
      `${header} - test-dao\n\nProposal: "${title}"\n\n⏱️ Time remaining: ~5 days and 18 hours\n📊 ${threshold}% of voting period has passed\n🗳️ {{address}}'s vote hasn't been recorded yet\n\n${urgency}\n\nParticipate in governance!`;

    it('should produce the early-reminder template at 30% threshold', () => {
      const event30 = { ...mockVotingReminderEvent, thresholdPercentage: 30, timeElapsedPercentage: 30 };

      const message = handler['createReminderMessage'](event30);

      expect(message).toBe(buildExpected(
        '🔔 Early Voting Reminder',
        'Test Proposal',
        30,
        '🔔 The voting period is underway. Take time to review and vote.',
      ));
    });

    it('should produce the mid-period template at 60% threshold', () => {
      const event60 = { ...mockVotingReminderEvent, thresholdPercentage: 60, timeElapsedPercentage: 60 };

      const message = handler['createReminderMessage'](event60);

      expect(message).toBe(buildExpected(
        '⏰ Mid-Period Voting Reminder',
        'Test Proposal',
        60,
        '⏰ More than half of the voting period has passed.',
      ));
    });

    it('should produce the urgent template at 90% threshold', () => {
      const event90 = { ...mockVotingReminderEvent, thresholdPercentage: 90, timeElapsedPercentage: 90 };

      const message = handler['createReminderMessage'](event90);

      expect(message).toBe(buildExpected(
        '🚨 URGENT Voting Reminder',
        'Test Proposal',
        90,
        '⚠️ This proposal is closing soon!',
      ));
    });

    it('should extract title from description when title is not provided', () => {
      const eventWithoutTitle = {
        ...mockVotingReminderEvent,
        title: undefined,
        description: 'Update governance parameters. This proposal aims to improve the system.',
      };

      const message = handler['createReminderMessage'](eventWithoutTitle);

      expect(message).toBe(buildExpected(
        '🚨 URGENT Voting Reminder',
        'Update governance parameters. This proposal aims to improve the system.',
        90,
        '⚠️ This proposal is closing soon!',
      ));
    });

    it('should handle long descriptions when extracting title', () => {
      const eventWithLongDescription = {
        ...mockVotingReminderEvent,
        title: undefined,
        description: 'This is a very long description that exceeds the maximum length for a title and should be truncated appropriately to avoid overwhelming the user with too much text in the notification message',
      };

      const message = handler['createReminderMessage'](eventWithLongDescription);

      expect(message).toBe(buildExpected(
        '🚨 URGENT Voting Reminder',
        'This is a very long description that exceeds the maximum length for a title and...',
        90,
        '⚠️ This proposal is closing soon!',
      ));
    });
  });

  describe('time calculations', () => {
    it('should calculate time remaining correctly', () => {
      const endTimestamp = 2000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);

      expect(remaining).toBe('~5 days and 18 hours');
    });

    it('should handle proposals that have ended', () => {
      const endTimestamp = 1000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);

      expect(remaining).toBe('Proposal has ended');
    });

    it('should format time in hours when less than a day remains', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1990000 * 1000);
      const endTimestamp = 2000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);

      expect(remaining).toBe('~2 hours and 46 minutes');
    });

    it('should format time in minutes when less than an hour remains', () => {
      vi.spyOn(Date, 'now').mockReturnValue(1999000 * 1000);
      const endTimestamp = 2000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);

      expect(remaining).toBe('~16 minutes');
    });
  });

  describe('error handling', () => {
    it('should continue processing other events when one fails', async () => {
      subscriptionClient.followedAddressesByDao.set('test-dao', ['0x456']);
      subscriptionClient.walletOwnersByAddress.set('0x456', [mockUser]);
      subscriptionClient.daoSubscribersByDao.set('test-dao', [mockUser]);
      nonVotersSource.nonVotersByProposal.set('successful-proposal', [{ voter: '0x456' }]);
      subscriptionClient.rejectFollowedAddressesNTimes(1);

      const failingEvent = { ...mockVotingReminderEvent, id: 'failing-proposal' };
      const successfulEvent = { ...mockVotingReminderEvent, id: 'successful-proposal' };
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.VotingReminder90,
        events: [failingEvent, successfulEvent],
      };

      const result = await handler.handleMessage(message);

      expect(result).toEqual({
        messageId: expect.stringMatching(/^voting-reminder-\d+$/),
        timestamp: expect.any(String),
      });
      expect(notificationFactory.client.sentPayloads).toHaveLength(1);
      expect(subscriptionClient.markedAsSent).toEqual([
        { user_id: mockUser.id, event_id: 'successful-proposal-90-voting-reminder', dao_id: 'test-dao' },
      ]);
    });
  });
});
