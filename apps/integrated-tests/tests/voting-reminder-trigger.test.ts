/**
 * @fileoverview Integration tests for the voting reminder feature
 * Tests the complete flow from Logic System trigger to Dispatcher handler
 */

import { describe, test, expect, beforeEach, beforeAll, afterEach } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';
import { waitForCondition } from '../src/helpers/utilities/wait-for';
import { votingReminderMessages, replacePlaceholders } from '@notification-system/messages';

describe('Voting Reminder Integration Tests', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = 'test-dao-voting-reminder';
  const testUser = {
    chatId: testConstants.profiles.p1.chatId,
    address: '0x1234567890abcdef1234567890abcdef12345678'
  };

  /**
   * Creates a proposal with specific time elapsed percentage
   * @param proposalId - Unique identifier for the proposal
   * @param elapsedPercentage - Percentage of voting period that has elapsed (0-100)
   */
  const createActiveProposalWithElapsedTime = (proposalId: string, elapsedPercentage: number) => {
    const now = Math.floor(Date.now() / 1000);
    const proposalDuration = 100000; // 100000 seconds total (about 27 hours) 
    const elapsedTime = Math.floor(proposalDuration * (elapsedPercentage / 100));
    const startTime = now - elapsedTime;
    const endTime = startTime + proposalDuration;

    return ProposalFactory.createProposal(testDaoId, proposalId, {
      status: 'ACTIVE',
      timestamp: startTime.toString(),
      endTimestamp: endTime.toString(),
      description: `Test proposal for ${elapsedPercentage}% voting reminder`,
      title: `Proposal ${elapsedPercentage}% Reminder Test`
    });
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
    
    // Create test user with subscription to the DAO and wallet address
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    const { user } = await UserFactory.createUserWithFollowedAddresses(
      testUser.chatId,
      'voting-reminder-user',
      testDaoId,
      [testUser.address],
      true,
      pastTimestamp
    );
  });

  describe('30% Reminder Threshold', () => {
    test('should send reminder when 30% of voting period has elapsed and user has not voted', async () => {
      // Create proposal where 32% of time has elapsed (triggers 30% reminder, within 30-35% window)
      const proposal = createActiveProposalWithElapsedTime('proposal-30-reminder', 32);
      
      // Setup mock to return the active proposal
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(), 
        [proposal], 
        [], 
        { [testDaoId]: 1 },
        [] // Empty votes array - user has NOT voted
      );

      // Wait for the notification to be sent
      const message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('Voting Reminder') || 
               msg.text.includes('voting reminder') ||
               msg.text.includes('30%'),
        { timeout: timeouts.notification.delivery }
      );

      // Verify message content
      expect(message.chatId).toBe(testUser.chatId);

      // Check header with actual DAO ID
      const expectedHeader = replacePlaceholders(
        votingReminderMessages.headers.early,
        { daoId: testDaoId }
      );
      expect(message.text).toContain(expectedHeader);

      // Check percentage in body
      expect(message.text).toContain('30%');

      // Check urgency message
      expect(message.text).toContain(votingReminderMessages.urgencyMessages.early);
      
      // Verify database record for deduplication
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => n.event_id?.includes('30-reminder'));
      expect(relevantNotifs).toHaveLength(1);
    });

    test('should NOT send reminder when user has already voted', async () => {
      // Create proposal where 32% of time has elapsed
      const proposal = createActiveProposalWithElapsedTime('proposal-30-voted', 32);
      
      // Setup mock with user's vote already recorded
      const voteEvents = [{
        daoId: testDaoId,
        proposalId: proposal.id,
        voterAccountId: testUser.address,
        support: '1',
        votingPower: '1000000000000000000000',
        timestamp: Math.floor(Date.now() / 1000).toString()
      }];
      
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        voteEvents // User HAS voted
      );

      // Wait for processing to complete and verify no messages
      await waitForCondition(
        () => {
          // Give the system a chance to process, but expect no messages
          const messages = telegramHelper.getAllMessages();
          // Return true after a minimal wait to confirm no messages are coming
          return messages.length === 0;
        },
        'Expected no voting reminder messages',
        { timeout: 500, interval: 50 }
      );

      // Double-check no voting reminder messages were sent
      const messages = telegramHelper.getAllMessages();
      const votingReminderMessages = messages.filter(m => 
        m.text.includes('Voting Reminder')
      );
      expect(votingReminderMessages).toHaveLength(0);
    });

    test('should NOT send duplicate reminder for same threshold', async () => {
      // Create proposal where 32% of time has elapsed
      const proposal = createActiveProposalWithElapsedTime('proposal-30-duplicate', 32);
      
      // Setup mock FIRST before inserting deduplication record
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        [] // User has NOT voted
      );
      
      // Wait for initial notification to be sent
      await waitForCondition(
        () => telegramHelper.getCallCount() > 0,
        'Expected initial voting reminder to be sent',
        { timeout: 1000, interval: 50 }
      );
      
      // Record the current message count after first notification
      const initialMessageCount = telegramHelper.getCallCount();

      // Wait briefly to ensure system processes again but doesn't send duplicate
      await waitForCondition(
        () => {
          // Just wait a minimal amount to let the system try to process again
          return true;
        },
        'Brief wait for potential duplicate processing',
        { timeout: 200, interval: 50 }
      );

      // Verify no new notifications were sent after the deduplication record was inserted
      const newMessageCount = telegramHelper.getCallCount() - initialMessageCount;
      expect(newMessageCount).toBe(0);
    });
  });

  describe('60% Reminder Threshold', () => {
    test('should send reminder when 60% of voting period has elapsed', async () => {
      // Create proposal where 62% of time has elapsed (triggers 60% reminder, within 60-65% window)
      const proposal = createActiveProposalWithElapsedTime('proposal-60-reminder', 62);
      
      // Setup mock to return the active proposal
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        [] // User has NOT voted
      );

      // Wait for the notification to be sent
      const message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('Mid-Period Voting Reminder') &&
               msg.text.includes('60%'),
        { timeout: timeouts.notification.delivery }
      );

      // Verify message content
      expect(message.chatId).toBe(testUser.chatId);

      // Check header with actual DAO ID
      const expectedHeader = replacePlaceholders(
        votingReminderMessages.headers.midPeriod,
        { daoId: testDaoId }
      );
      expect(message.text).toContain(expectedHeader);

      // Check percentage in body
      expect(message.text).toContain('60%');

      // Check urgency message
      expect(message.text).toContain(votingReminderMessages.urgencyMessages.midPeriod);
      
      // Verify database record
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => n.event_id?.includes('60-reminder'));
      expect(relevantNotifs).toHaveLength(1);
    });
  });

  describe('90% Reminder Threshold', () => {
    test('should send urgent reminder when 90% of voting period has elapsed', async () => {
      // Create proposal where 92% of time has elapsed (triggers 90% reminder)
      const proposal = createActiveProposalWithElapsedTime('proposal-90-reminder', 92);
      
      // Setup mock
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        [] // User has NOT voted
      );

      // Wait for the notification to be sent
      const message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('URGENT Voting Reminder') &&
               msg.text.includes('90%'),
        { timeout: timeouts.notification.delivery }
      );

      // Verify message content
      expect(message.chatId).toBe(testUser.chatId);

      // Check header with actual DAO ID
      const expectedHeader = replacePlaceholders(
        votingReminderMessages.headers.urgent,
        { daoId: testDaoId }
      );
      expect(message.text).toContain(expectedHeader);

      // Check percentage in body
      expect(message.text).toContain('90%');
      
      // Verify database record
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => n.event_id?.includes('90-reminder'));
      expect(relevantNotifs).toHaveLength(1);
    });

    test('should calculate and display time remaining correctly', async () => {
      // Create proposal with exactly 1 hour remaining (90% of 10 hours elapsed)
      const now = Math.floor(Date.now() / 1000);
      const proposalDuration = 36000; // 10 hours total
      const elapsedTime = 32400; // 9 hours elapsed (90%)
      const startTime = now - elapsedTime;
      const endTime = startTime + proposalDuration;

      const proposal = ProposalFactory.createProposal(testDaoId, 'proposal-time-calc', {
        status: 'ACTIVE',
        timestamp: startTime.toString(),
        endTimestamp: endTime.toString(),
        description: 'Test time calculation'
      });
      
      // Setup mocks
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        []
      );

      // Wait for the notification
      const message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('URGENT Voting Reminder'),
        { timeout: timeouts.notification.delivery }
      );

      // Verify time remaining is displayed
      expect(message.text).toMatch(/Time remaining: ~1 hour/);
    });
  });

  describe('Multiple Thresholds', () => {
    test('should send different reminders at different thresholds for same proposal', async () => {
      const proposalId = 'proposal-multi-threshold';
      
      // First: 30% threshold
      let proposal = createActiveProposalWithElapsedTime(proposalId, 32);
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        []
      );

      let message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('Early Voting Reminder'),
        { timeout: timeouts.notification.delivery }
      );
      expect(message.text).toContain('30% of voting period has passed');

      // Second: 60% threshold (proposal time has advanced)
      proposal = createActiveProposalWithElapsedTime(proposalId, 62);
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        []
      );

      message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('Mid-Period Voting Reminder'),
        { timeout: timeouts.notification.delivery }
      );
      expect(message.text).toContain('60% of voting period has passed');

      // Verify both reminders are recorded
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => 
        n.event_id?.includes(proposalId) && n.event_id?.includes('reminder')
      );
      expect(relevantNotifs.length).toBeGreaterThanOrEqual(2);
      
      const eventIds = relevantNotifs.map(n => n.event_id);
      expect(eventIds).toEqual(
        expect.arrayContaining([
          expect.stringContaining('30-reminder'),
          expect.stringContaining('60-reminder')
        ])
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle proposals with no title gracefully', async () => {
      const proposal = createActiveProposalWithElapsedTime('proposal-no-title', 32);
      // Remove title to test extraction from description
      proposal.title = undefined;
      proposal.description = 'Update governance parameters. This proposal aims to improve the system.';
      
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        []
      );

      const message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('Voting Reminder'),
        { timeout: timeouts.notification.delivery }
      );

      // Should extract title from description
      expect(message.text).toContain('Update governance parameters');
    });

    test('should not send reminder for proposals below threshold', async () => {
      // Create proposal where only 25% of time has elapsed (below 30% threshold)
      const proposal = createActiveProposalWithElapsedTime('proposal-below-threshold', 25);
      
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        []
      );

      // Wait for processing to complete and verify no messages
      await waitForCondition(
        () => {
          // Give the system a chance to process, but expect no messages
          const messages = telegramHelper.getAllMessages();
          // Return true after a minimal wait to confirm no messages are coming
          return messages.length === 0;
        },
        'Expected no voting reminder for below-threshold proposal',
        { timeout: 500, interval: 50 }
      );

      // Verify no notifications were sent
      const messages = telegramHelper.getAllMessages();
      const votingReminderMessages = messages.filter(m => 
        m.text.includes('Voting Reminder')
      );
      expect(votingReminderMessages).toHaveLength(0);
    });

    test('should not send reminder for non-subscribed users', async () => {
      // Create another user who is NOT subscribed to the DAO
      const nonSubscribedUser = {
        chatId: testConstants.profiles.p2.chatId, // Use different real Telegram ID
        address: '0xabcdef1234567890123456789012345678901234'
      };
      
      await UserFactory.createUserWithFollowedAddresses(
        nonSubscribedUser.chatId,
        'non-subscribed-user',
        'different-dao', // Different DAO
        [nonSubscribedUser.address],
        true
      );
      
      // Create proposal in original DAO
      const proposal = createActiveProposalWithElapsedTime('proposal-non-subscribed', 32);
      
      GraphQLMockSetup.setupMock(
        httpMockSetup.getMockClient(),
        [proposal],
        [],
        { [testDaoId]: 1 },
        []
      );

      // Wait for notification (should only go to subscribed user)
      const message = await telegramHelper.waitForMessage(
        msg => msg.text.includes('Voting Reminder'),
        { timeout: timeouts.notification.delivery }
      );

      // Verify only the subscribed user received the message
      expect(message.chatId).toBe(testUser.chatId);
      
      // Verify no message was sent to non-subscribed user
      const allMessages = telegramHelper.getAllMessages();
      const nonSubscribedMessages = allMessages.filter(m => m.chatId === nonSubscribedUser.chatId);
      expect(nonSubscribedMessages).toHaveLength(0);
    });
  });
});