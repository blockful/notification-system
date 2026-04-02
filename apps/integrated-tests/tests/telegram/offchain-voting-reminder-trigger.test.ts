/**
 * @fileoverview Integration tests for the Snapshot (off-chain) voting reminder feature
 * Tests the complete flow for the offchainVotingReminderTrigger75 trigger
 * which fires at 75% elapsed time (within 75-80% window)
 */

import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, OffchainProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';
import { waitForCondition } from '../../src/helpers/utilities/wait-for';

describe('Offchain Voting Reminder Integration Tests', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = 'test-dao-offchain-reminder';
  const testUser = {
    chatId: testConstants.profiles.p1.chatId,
    address: '0x1234567890abcdef1234567890abcdef12345678'
  };

  /**
   * Creates an offchain proposal with a specific elapsed time percentage
   * @param proposalId - Unique identifier for the proposal
   * @param elapsedPercentage - Percentage of voting period that has elapsed (0-100)
   */
  const createOffchainProposalWithElapsedTime = (proposalId: string, elapsedPercentage: number) => {
    const now = Math.floor(Date.now() / 1000);
    const duration = 100000; // seconds
    const elapsed = Math.floor(duration * (elapsedPercentage / 100));
    const start = now - elapsed;
    const end = start + duration;

    return OffchainProposalFactory.createProposal(testDaoId, proposalId, {
      state: 'active',
      start,
      end,
      created: start,
      title: `Snapshot Proposal ${elapsedPercentage}% Test`
    });
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();

    // Create test user with subscription to the DAO and wallet address
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    await UserFactory.createUserWithFollowedAddresses(
      testUser.chatId,
      'offchain-voting-reminder-user',
      testDaoId,
      [testUser.address],
      true,
      pastTimestamp
    );
  });

  describe('75% Reminder Threshold', () => {
    test('should send Snapshot voting reminder when 77% of voting period has elapsed and user has not voted', async () => {
      // Create proposal where 77% of time has elapsed (within 75-80% window)
      const proposal = createOffchainProposalWithElapsedTime('offchain-proposal-75-reminder', 77);

      // Setup mock with no offchain votes — user has NOT voted
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [],       // no on-chain proposals
        [],       // no voting power data
        { [testDaoId]: 1 },
        [],       // no on-chain votes
        [proposal],
        []        // no offchain votes
      );

      // Wait for the notification to be sent
      const message = await telegramHelper.waitForMessage(
        msg =>
          msg.text.includes('Snapshot Voting Reminder') ||
          msg.text.includes('75% of voting period has passed'),
        { timeout: timeouts.notification.delivery }
      );

      // Verify message content matches the expected template
      expect(message.chatId).toBe(testUser.chatId);
      expect(message.text).toContain('⏰ Snapshot Voting Reminder');
      expect(message.text).toContain('75% of voting period has passed');
      expect(message.text).toContain(testDaoId);

      // Verify database record exists for deduplication
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n =>
        n.event_id?.includes('75-reminder') || n.event_id?.includes('offchain-proposal-75-reminder')
      );
      expect(relevantNotifs).toHaveLength(1);
    });

    test('should NOT send reminder when user has already voted on the Snapshot proposal', async () => {
      // Create proposal where 77% of time has elapsed
      const proposal = createOffchainProposalWithElapsedTime('offchain-proposal-75-voted', 77);

      // Setup mock with user's offchain vote already recorded
      const offchainVotes = [{
        voter: testUser.address,
        proposalId: proposal.id,
        daoId: testDaoId,
        created: Math.floor(Date.now() / 1000),
        vp: 1000
      }];

      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [],
        [],
        { [testDaoId]: 1 },
        [],
        [proposal],
        offchainVotes // User HAS voted
      );

      // Wait for processing to complete and verify no messages were sent
      await waitForCondition(
        () => {
          const messages = telegramHelper.getAllMessages();
          return messages.length === 0;
        },
        'Expected no offchain voting reminder when user has already voted',
        { timeout: 500, interval: 50 }
      );

      const messages = telegramHelper.getAllMessages();
      const snapshotReminderMessages = messages.filter(m =>
        m.text.includes('Snapshot Voting Reminder')
      );
      expect(snapshotReminderMessages).toHaveLength(0);
    });

    test('should NOT send reminder when proposal is at 60% elapsed (below 75% threshold)', async () => {
      // Create proposal where only 60% of time has elapsed — below the 75% trigger
      const proposal = createOffchainProposalWithElapsedTime('offchain-proposal-below-threshold', 60);

      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [],
        [],
        { [testDaoId]: 1 },
        [],
        [proposal],
        []
      );

      // Wait for processing and verify no messages were sent
      await waitForCondition(
        () => {
          const messages = telegramHelper.getAllMessages();
          return messages.length === 0;
        },
        'Expected no offchain voting reminder for proposal below 75% threshold',
        { timeout: 500, interval: 50 }
      );

      const messages = telegramHelper.getAllMessages();
      const snapshotReminderMessages = messages.filter(m =>
        m.text.includes('Snapshot Voting Reminder')
      );
      expect(snapshotReminderMessages).toHaveLength(0);
    });

    test('should NOT send reminder when proposal is at 83% elapsed (above 80% window)', async () => {
      // Create proposal where 83% of time has elapsed — above the 75-80% window
      const proposal = createOffchainProposalWithElapsedTime('offchain-proposal-above-window', 83);

      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [],
        [],
        { [testDaoId]: 1 },
        [],
        [proposal],
        []
      );

      // Wait for processing and verify no messages were sent
      await waitForCondition(
        () => {
          const messages = telegramHelper.getAllMessages();
          return messages.length === 0;
        },
        'Expected no offchain voting reminder for proposal above 80% window',
        { timeout: 500, interval: 50 }
      );

      const messages = telegramHelper.getAllMessages();
      const snapshotReminderMessages = messages.filter(m =>
        m.text.includes('Snapshot Voting Reminder')
      );
      expect(snapshotReminderMessages).toHaveLength(0);
    });
  });
});
