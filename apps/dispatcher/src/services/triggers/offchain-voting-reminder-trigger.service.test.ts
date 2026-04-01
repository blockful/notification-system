/**
 * @fileoverview Tests for OffchainVotingReminderTriggerHandler
 */

import { OffchainVotingReminderTriggerHandler } from './offchain-voting-reminder-trigger.service';
import { DispatcherMessage } from '../../interfaces/dispatcher-message.interface';
import { ISubscriptionClient } from '../../interfaces/subscription-client.interface';
import { NotificationClientFactory } from '../notification/notification-factory.service';
import { AnticaptureClient } from '@notification-system/anticapture-client';
import { NotificationTypeId } from '@notification-system/messages';

describe('OffchainVotingReminderTriggerHandler', () => {
  let handler: OffchainVotingReminderTriggerHandler;
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
    id: 'snapshot-proposal-123',
    daoId: 'test-dao',
    title: 'Test Snapshot Proposal',
    description: undefined,
    startTimestamp: 1000000,
    endTimestamp: 2000000,
    timeElapsedPercentage: 76.5,
    thresholdPercentage: 75,
    link: 'https://snapshot.org/#/test-dao/proposal/123',
    discussion: 'https://forum.test-dao.org/t/123'
  };

  beforeEach(() => {
    mockSubscriptionClient = {
      getFollowedAddresses: jest.fn(),
      getWalletOwnersBatch: jest.fn(),
      shouldSend: jest.fn(),
      shouldSendBatch: jest.fn(),
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
      getOffchainProposalNonVoters: jest.fn()
    } as any;

    handler = new OffchainVotingReminderTriggerHandler(
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
        triggerId: NotificationTypeId.OffchainVotingReminder75,
        events: []
      };

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/offchain-voting-reminder-empty-/);
      expect(mockSubscriptionClient.getFollowedAddresses).not.toHaveBeenCalled();
    });

    it('should skip when no subscribed addresses found', async () => {
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.OffchainVotingReminder75,
        events: [mockVotingReminderEvent]
      };

      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue([]);

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/offchain-voting-reminder-/);
      expect(mockAnticaptureClient.getOffchainProposalNonVoters).not.toHaveBeenCalled();
    });

    it('should skip when all users have already voted', async () => {
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.OffchainVotingReminder75,
        events: [mockVotingReminderEvent]
      };

      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(['0x123']);
      mockAnticaptureClient.getOffchainProposalNonVoters.mockResolvedValue([]); // Empty array - all have voted

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/offchain-voting-reminder-/);
      expect(mockSubscriptionClient.getWalletOwnersBatch).not.toHaveBeenCalled();
    });

    it('should process voting reminder events successfully', async () => {
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.OffchainVotingReminder75,
        events: [mockVotingReminderEvent]
      };

      // Setup mocks
      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(['0x123', '0x456']);
      mockAnticaptureClient.getOffchainProposalNonVoters.mockResolvedValue([
        { voter: '0x456' } // Only 0x456 hasn't voted
      ]);
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
        '0x456': [mockUser] // Only 0x456 (non-voter) has users
      });
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue([mockUser]);
      mockSubscriptionClient.shouldSendBatch.mockResolvedValue([[{
        user_id: mockUser.id,
        event_id: 'snapshot-proposal-123-75-offchain-reminder',
        dao_id: 'test-dao'
      }]]);
      mockSubscriptionClient.markAsSent.mockResolvedValue(undefined);

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/offchain-voting-reminder-/);
      expect(mockSubscriptionClient.getFollowedAddresses).toHaveBeenCalledWith('test-dao');
      // NOTE: called with (proposalId, addresses) — NO daoId parameter
      expect(mockAnticaptureClient.getOffchainProposalNonVoters).toHaveBeenCalledWith(
        'snapshot-proposal-123',
        ['0x123', '0x456']
      );
      expect(mockSubscriptionClient.getWalletOwnersBatch).toHaveBeenCalledWith(
        ['0x456'],
        NotificationTypeId.OffchainVotingReminder75
      );
    });

    it('should use single offchain message template (Snapshot Voting Reminder)', async () => {
      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.OffchainVotingReminder75,
        events: [mockVotingReminderEvent]
      };

      const mockSendNotification = jest.fn().mockResolvedValue(undefined);
      mockNotificationFactory.getClient.mockReturnValue({ sendNotification: mockSendNotification } as any);

      mockSubscriptionClient.getFollowedAddresses.mockResolvedValue(['0x456']);
      mockAnticaptureClient.getOffchainProposalNonVoters.mockResolvedValue([
        { voter: '0x456' }
      ]);
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
        '0x456': [mockUser]
      });
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue([mockUser]);
      mockSubscriptionClient.shouldSendBatch.mockResolvedValue([[{
        user_id: mockUser.id,
        event_id: 'snapshot-proposal-123-75-offchain-reminder',
        dao_id: 'test-dao'
      }]]);
      mockSubscriptionClient.markAsSent.mockResolvedValue(undefined);

      await handler.handleMessage(message);

      // Verify the notification client was called and message uses "Snapshot Voting Reminder" (single offchain template)
      expect(mockSendNotification).toHaveBeenCalled();
      const callArgs = mockSendNotification.mock.calls[0];
      const notificationMessage: string = callArgs[0].message;
      expect(notificationMessage).toContain('Snapshot Voting Reminder');
    });

    it('should continue processing other events when one fails', async () => {
      const failingEvent = { ...mockVotingReminderEvent, id: 'failing-proposal' };
      const successfulEvent = { ...mockVotingReminderEvent, id: 'successful-proposal' };

      const message: DispatcherMessage = {
        triggerId: NotificationTypeId.OffchainVotingReminder75,
        events: [failingEvent, successfulEvent]
      };

      // Make first call fail, second succeed
      mockSubscriptionClient.getFollowedAddresses
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(['0x456']);

      mockAnticaptureClient.getOffchainProposalNonVoters.mockResolvedValue([
        { voter: '0x456' }
      ]);
      mockSubscriptionClient.getWalletOwnersBatch.mockResolvedValue({
        '0x456': [mockUser]
      });
      mockSubscriptionClient.getDaoSubscribers.mockResolvedValue([mockUser]);
      mockSubscriptionClient.shouldSendBatch.mockResolvedValue([[{
        user_id: mockUser.id,
        event_id: 'successful-proposal-75-offchain-reminder',
        dao_id: 'test-dao'
      }]]);
      mockSubscriptionClient.markAsSent.mockResolvedValue(undefined);

      const result = await handler.handleMessage(message);

      expect(result.messageId).toMatch(/offchain-voting-reminder-/);
      // Should have attempted both events
      expect(mockSubscriptionClient.getFollowedAddresses).toHaveBeenCalledTimes(2);
    });
  });
});
