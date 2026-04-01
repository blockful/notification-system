/**
 * @fileoverview Tests for VotingReminderTriggerHandler
 */

import { VotingReminderTriggerHandler } from './voting-reminder-trigger.service';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { FormattingService } from '../formatting.service';

describe('VotingReminderTriggerHandler', () => {
  let handler: VotingReminderTriggerHandler;
  let mockSubscriptionClient: jest.Mocked<ISubscriptionClient>;
  let mockNotificationFactory: jest.Mocked<NotificationClientFactory>;
  let mockAnticaptureClient: jest.Mocked<AnticaptureClient>;

  const mockUser = {
    id: 'user-123',
    channel: 'telegram',
    channel_user_id: 'tg-123',
    created_at: new Date('2024-01-01T00:00:00Z')
  };

  const mockVotingReminderEvent = {
    id: 'proposal-123',
    daoId: 'test-dao',
    title: 'Test Proposal',
    description: 'A test proposal for voting reminder',
    startTimestamp: 1000000,
    endTimestamp: 2000000,
    timeElapsedPercentage: 75.5,
    thresholdPercentage: 90
  };

  const createNonVoter = (voter: string) => ({
    voter,
    votingPower: '1',
    lastVoteTimestamp: 0,
    votingPowerVariation: '0'
  });

  beforeEach(() => {
    mockSubscriptionClient = {
      getFollowedAddresses: jest.fn(),
      getWalletOwnersBatch: jest.fn(),
      shouldSend: jest.fn(),
      getDaoSubscribers: jest.fn(),
      markAsSent: jest.fn()
    } as any;

    mockNotificationFactory = {
      supportsChannel: jest.fn().mockReturnValue(true),
      getClient: jest.fn().mockReturnValue({
        sendNotification: jest.fn().mockResolvedValue(undefined)
      })
    } as any;

    mockAnticaptureClient = {
      getProposalNonVoters: jest.fn()
    } as any;

    handler = new VotingReminderTriggerHandler(
      mockSubscriptionClient,
      mockNotificationFactory,
      mockAnticaptureClient
    );

    // Mock Date.now for consistent time calculations
    jest.spyOn(Date, 'now').mockReturnValue(1500000 * 1000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('handleMessage', () => {
    it('should handle empty events array', async () => {
      const message: DispatcherMessage = {
        triggerId: 'voting-reminder-90',
        events: []
      };

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/voting-reminder-empty-/);
      expect(mockSubscriptionClient.getFollowedAddresses).not.toHaveBeenCalled();
    });

    it('should process voting reminder events successfully', async () => {
      const message: DispatcherMessage = {
        triggerId: 'voting-reminder-90',
        events: [mockVotingReminderEvent]
      };

      // Setup mocks
      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(['0x123', '0x456']);
      mockAnticaptureClient.getProposalNonVoters.mockResolvedValue([
        createNonVoter('0x456')  // Only 0x456 hasn't voted
      ]);
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
        '0x456': [mockUser] // Only 0x456 (non-voter) has users
      });
      mockSubscriptionClient.shouldSend.mockResolvedValue([{
        user_id: mockUser.id,
        event_id: 'proposal-123-90-reminder',
        dao_id: 'test-dao'
      }]);

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/voting-reminder-/);
      expect(mockSubscriptionClient.getFollowedAddresses).toHaveBeenCalledWith('test-dao');
      expect(mockAnticaptureClient.getProposalNonVoters).toHaveBeenCalledWith(
        'proposal-123',
        'test-dao',
        ['0x123', '0x456']
      );
      expect(mockSubscriptionClient.getWalletOwnersBatch).toHaveBeenCalledWith(['0x456']);
    });

    it('should skip when no subscribed addresses found', async () => {
      const message: DispatcherMessage = {
        triggerId: 'voting-reminder-90',
        events: [mockVotingReminderEvent]
      };

      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue([]);

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/voting-reminder-/);
      expect(mockAnticaptureClient.getProposalNonVoters).not.toHaveBeenCalled();
    });

    it('should skip when all users have already voted', async () => {
      const message: DispatcherMessage = {
        triggerId: 'voting-reminder-90',
        events: [mockVotingReminderEvent]
      };

      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(['0x123']);
      mockAnticaptureClient.getProposalNonVoters.mockResolvedValue([]); // Empty array - all have voted

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/voting-reminder-/);
      expect(mockSubscriptionClient.getWalletOwnersBatch).not.toHaveBeenCalled();
    });

    it('should skip when all users have already received reminders', async () => {
      const message: DispatcherMessage = {
        triggerId: 'voting-reminder-90',
        events: [mockVotingReminderEvent]
      };

      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(['0x456']);
      mockAnticaptureClient.getProposalNonVoters.mockResolvedValue([
        createNonVoter('0x456')
      ]);
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
        '0x456': [mockUser]
      });
      mockSubscriptionClient.shouldSend.mockResolvedValue([]); // All already notified

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/voting-reminder-/);
      expect(mockNotificationFactory.getClient).not.toHaveBeenCalled();
    });
  });

  describe('message creation', () => {
    it('should create different messages based on threshold percentage', () => {
      const event30 = { ...mockVotingReminderEvent, thresholdPercentage: 30, timeElapsedPercentage: 30 };
      const event60 = { ...mockVotingReminderEvent, thresholdPercentage: 60, timeElapsedPercentage: 60 };
      const event90 = { ...mockVotingReminderEvent, thresholdPercentage: 90, timeElapsedPercentage: 90 };

      const message30 = (handler as any).createReminderMessage(event30);
      const message60 = (handler as any).createReminderMessage(event60);
      const message90 = (handler as any).createReminderMessage(event90);

      expect(message30).toContain('🔔 Early Voting Reminder');
      expect(message30).toContain('30% of voting period has passed');
      expect(message30).toContain('Take time to review and vote');

      expect(message60).toContain('⏰ Mid-Period Voting Reminder');
      expect(message60).toContain('60% of voting period has passed');
      expect(message60).toContain('More than half of the voting period has passed');

      expect(message90).toContain('🚨 URGENT Voting Reminder');
      expect(message90).toContain('90% of voting period has passed');
      expect(message90).toContain('This proposal is closing soon!');
    });

    it('should extract title from description when title is not provided', () => {
      const eventWithoutTitle = {
        ...mockVotingReminderEvent,
        title: undefined,
        description: 'Update governance parameters. This proposal aims to improve the system.'
      };

      const message = (handler as any).createReminderMessage(eventWithoutTitle);
      
      expect(message).toContain('Proposal: "Update governance parameters. This proposal aims to improve the system."');
    });

    it('should handle long descriptions when extracting title', () => {
      const eventWithLongDescription = {
        ...mockVotingReminderEvent,
        title: undefined,
        description: 'This is a very long description that exceeds the maximum length for a title and should be truncated appropriately to avoid overwhelming the user with too much text in the notification message'
      };

      const message = (handler as any).createReminderMessage(eventWithLongDescription);
      
      expect(message).toContain('Proposal: "This is a very long description that exceeds the maximum length for a title and..."');
    });
  });

  describe('time calculations', () => {
    it('should calculate time remaining correctly', () => {
      // Mock current time to be 1500000 (middle of proposal period)
      const endTimestamp = 2000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);
      
      expect(remaining).toContain('day'); // Should show days remaining
    });

    it('should handle proposals that have ended', () => {
      const endTimestamp = 1000000; // Before current time (1500000)
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);
      
      expect(remaining).toBe('Proposal has ended');
    });

    it('should format time in hours when less than a day remains', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1990000 * 1000); // Close to end
      const endTimestamp = 2000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);
      
      expect(remaining).toMatch(/hour/);
    });

    it('should format time in minutes when less than an hour remains', () => {
      jest.spyOn(Date, 'now').mockReturnValue(1999000 * 1000); // Very close to end
      const endTimestamp = 2000000;
      const remaining = FormattingService.calculateTimeRemaining(endTimestamp);
      
      expect(remaining).toMatch(/minute/);
    });
  });

  describe('error handling', () => {
    it('should continue processing other events when one fails', async () => {
      const failingEvent = { ...mockVotingReminderEvent, id: 'failing-proposal' };
      const successfulEvent = { ...mockVotingReminderEvent, id: 'successful-proposal' };
      
      const message: DispatcherMessage = {
        triggerId: 'voting-reminder-90',
        events: [failingEvent, successfulEvent]
      };

      // Make first call fail, second succeed
      mockSubscriptionClient.getFollowedAddresses
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(['0x456']);

      mockAnticaptureClient.getProposalNonVoters.mockResolvedValue([
        createNonVoter('0x456')
      ]);
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
        '0x456': [mockUser]
      });
      mockSubscriptionClient.shouldSend.mockResolvedValue([{
        user_id: mockUser.id,
        event_id: 'proposal-123-90-reminder',
        dao_id: 'test-dao'
      }]);

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/voting-reminder-/);
      // Should have attempted both events
      expect(mockSubscriptionClient.getFollowedAddresses).toHaveBeenCalledTimes(2);
    });
  });
});
