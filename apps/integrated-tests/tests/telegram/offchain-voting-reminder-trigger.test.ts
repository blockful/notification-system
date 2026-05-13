/**
 * @fileoverview Integration tests for the Snapshot (off-chain) voting reminder feature
 * Tests the complete flow for the offchainVotingReminderTrigger75 trigger
 * which fires at 75% elapsed time (within 75-80% window)
 */

import { describe, test, expect, beforeEach, beforeAll } from 'vitest';
import {
  offchainProposalsHandler,
  votesOffchainHandler,
  offchainProposalNonVotersHandler,
} from '@anticapture/client/msw';
import { offchainProposalStatusListEnum, type OffchainProposal, type OffchainVote } from '@notification-system/anticapture-client';
import { db, TestApps } from '../../src/setup';
import { server, nonVotersResolver } from '../../src/setup/msw-server';
import { UserFactory, OffchainProposalFactory, OffchainVoteFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';
import { waitForCondition } from '../../src/helpers/utilities/wait-for';

const useOffchainProposalsAndVotes = (proposals: OffchainProposal[], votes: OffchainVote[]) =>
  server.use(
    offchainProposalsHandler({ items: proposals, totalCount: proposals.length }),
    votesOffchainHandler({ items: votes, totalCount: votes.length }),
    offchainProposalNonVotersHandler(nonVotersResolver(votes)),
  );

describe('Offchain Voting Reminder Integration Tests', () => {
  let apps: TestApps;

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
      state: offchainProposalStatusListEnum.active,
      start,
      end,
      created: start,
      title: `Snapshot Proposal ${elapsedPercentage}% Test`
    });
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();

    telegramHelper = new TelegramTestHelper(global.telegramClient);
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

      useOffchainProposalsAndVotes([proposal], []);

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
      const offchainVotes = [OffchainVoteFactory.createVote(testUser.address, proposal.id, {
        vp: 1000
      })];

      useOffchainProposalsAndVotes([proposal], offchainVotes);

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

      useOffchainProposalsAndVotes([proposal], []);

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

      useOffchainProposalsAndVotes([proposal], []);

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
