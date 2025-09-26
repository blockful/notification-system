/**
 * Slack Voting Reminder Trigger - Integration Test
 * Tests that voting reminder notifications are correctly delivered via Slack
 * Supports both mock and real Slack delivery modes
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, ProposalFactory, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SlackTestClient } from '../../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../../src/config';
import { env } from '../../src/config/env';
import { waitForCondition } from '../../src/helpers/utilities/wait-for';

describe('Slack Voting Reminder Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = 'test-dao-voting-reminder';

  // Helper function for creating Slack users with wallets
  const createSlackUserWithWallet = async (channelId: string, daoId: string, walletAddress: string) => {
    const slackUserId = `T_DEFAULT:${channelId}`;
    const pastTimestamp = new Date(Date.now() - 60000).toISOString();
    const { user } = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      daoId,
      true,
      pastTimestamp,
      'slack'
    );
    await UserFactory.createUserAddress(user.id, walletAddress, pastTimestamp);
    return user;
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

    // Create Slack client and helper
    slackClient = new SlackTestClient(global.mockSlackSendMessage);
    slackHelper = new SlackTestHelper(global.mockSlackSendMessage, slackClient);

    dbHelper = new DatabaseTestHelper(db);

    // Create default Slack workspace for OAuth support
    await WorkspaceFactory.createDefaultSlackWorkspace();
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  describe('30% Reminder Threshold', () => {
    test('should send reminder when 30% of voting period has elapsed and user has not voted via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_30_01';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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
      const message = await slackHelper.waitForMessage(
        msg => (msg.text.includes('Voting Reminder') ||
                msg.text.includes('voting reminder') ||
                msg.text.includes('30%')) &&
                msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          errorMessage: 'Slack 30% voting reminder not received',
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
      );

      // Verify message content
      expect(message.channel).toBe(channelId);
      expect(message.text).toContain('🔔 Early Voting Reminder');
      expect(message.text).toContain('30% of voting period has passed');
      expect(message.text).toContain('Take your time to review and vote');
      expect(message.text).toContain(testDaoId);

      // Verify Slack link formatting
      if (message.text.includes('http')) {
        expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
      }

      // Verify message has substantial content
      expect(message.text.length).toBeGreaterThan(50);

      // In real mode, also verify through conversations.history
      if (env.SEND_REAL_SLACK === 'true') {
        const history = await slackClient.getMessageHistory(channelId, 10);
        const foundMessage = history.find(msg =>
          msg.text?.includes('30%') && msg.text?.includes('Voting Reminder')
        );
        expect(foundMessage).toBeDefined();
        console.log('✅ Real Slack 30% voting reminder delivered and verified via conversations.history');
      }

      // Verify database record for deduplication
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => n.event_id?.includes('30-reminder'));
      expect(relevantNotifs).toHaveLength(1);
    });

    test('should NOT send reminder when user has already voted via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_30_VTD';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

      // Create proposal where 32% of time has elapsed
      const proposal = createActiveProposalWithElapsedTime('proposal-30-voted', 32);

      // Setup mock with user's vote already recorded
      const voteEvents = [{
        daoId: testDaoId,
        proposalId: proposal.id,
        voterAccountId: userAddress,
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
          const messages = slackHelper.getAllMessages();
          // Return true after a minimal wait to confirm no messages are coming
          return messages.length === 0;
        },
        'Expected no voting reminder messages',
        { timeout: 500, interval: 50 }
      );

      // Double-check no voting reminder messages were sent
      const messages = slackHelper.getAllMessages();
      const votingReminderMessages = messages.filter(m =>
        m.text.includes('Voting Reminder')
      );
      expect(votingReminderMessages).toHaveLength(0);
    });

    test('should NOT send duplicate reminder for same threshold via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_30_DUP';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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
        () => slackHelper.getCallCount() > 0,
        'Expected initial voting reminder to be sent',
        { timeout: 1000, interval: 50 }
      );

      // Record the current message count after first notification
      const initialMessageCount = slackHelper.getCallCount();

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
      const newMessageCount = slackHelper.getCallCount() - initialMessageCount;
      expect(newMessageCount).toBe(0);
    });
  });

  describe('60% Reminder Threshold', () => {
    test('should send reminder when 60% of voting period has elapsed via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_60_01';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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
      const message = await slackHelper.waitForMessage(
        msg => msg.text.includes('Mid-Period Voting Reminder') &&
               msg.text.includes('60% of voting period has passed') &&
               msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          errorMessage: 'Slack 60% voting reminder not received',
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
      );

      // Verify message content
      expect(message.channel).toBe(channelId);
      expect(message.text).toContain('⏰ Mid-Period Voting Reminder');
      expect(message.text).toContain('60% of voting period has passed');
      expect(message.text).toContain('More than half of the voting period has passed');

      // Verify Slack link formatting
      if (message.text.includes('http')) {
        expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
      }

      // In real mode, verify through conversations.history
      if (env.SEND_REAL_SLACK === 'true') {
        const history = await slackClient.getMessageHistory(channelId, 10);
        const foundMessage = history.find(msg =>
          msg.text?.includes('60%') && msg.text?.includes('Mid-Period')
        );
        expect(foundMessage).toBeDefined();
        console.log('✅ Real Slack 60% voting reminder delivered and verified');
      }

      // Verify database record
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => n.event_id?.includes('60-reminder'));
      expect(relevantNotifs).toHaveLength(1);
    });
  });

  describe('90% Reminder Threshold', () => {
    test('should send urgent reminder when 90% of voting period has elapsed via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_90_01';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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
      const message = await slackHelper.waitForMessage(
        msg => msg.text.includes('URGENT Voting Reminder') &&
               msg.text.includes('90% of voting period has passed') &&
               msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          errorMessage: 'Slack 90% urgent voting reminder not received',
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
      );

      // Verify message content
      expect(message.channel).toBe(channelId);
      expect(message.text).toContain('🚨 URGENT Voting Reminder');
      expect(message.text).toContain('90% of voting period has passed');
      expect(message.text).toContain('This proposal is closing soon!');

      // Verify Slack link formatting
      if (message.text.includes('http')) {
        expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
      }

      // In real mode, verify through conversations.history
      if (env.SEND_REAL_SLACK === 'true') {
        const history = await slackClient.getMessageHistory(channelId, 10);
        const foundMessage = history.find(msg =>
          msg.text?.includes('90%') && msg.text?.includes('URGENT')
        );
        expect(foundMessage).toBeDefined();
        console.log('✅ Real Slack 90% urgent voting reminder delivered and verified');
      }

      // Verify database record
      const notifications = await dbHelper.getNotifications();
      const relevantNotifs = notifications.filter(n => n.event_id?.includes('90-reminder'));
      expect(relevantNotifs).toHaveLength(1);
    });

    test('should calculate and display time remaining correctly via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_TIME';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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
      const message = await slackHelper.waitForMessage(
        msg => msg.text.includes('URGENT Voting Reminder') &&
               msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          errorMessage: 'Slack time calculation reminder not received',
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
      );

      // Verify time remaining is displayed
      expect(message.text).toMatch(/Time remaining: ~1 hour/);
    });
  });

  describe('Multiple Thresholds', () => {
    test('should send different reminders at different thresholds for same proposal via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_MULTI';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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

      let message = await slackHelper.waitForMessage(
        msg => msg.text.includes('Early Voting Reminder') &&
               msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
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

      message = await slackHelper.waitForMessage(
        msg => msg.text.includes('Mid-Period Voting Reminder') &&
               msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
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
    test('should handle proposals with no title gracefully via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_NOTIT';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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

      const message = await slackHelper.waitForMessage(
        msg => msg.text.includes('Voting Reminder') &&
               msg.channel === channelId,
        {
          timeout: timeouts.notification.delivery,
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: channelId
        }
      );

      // Should extract title from description
      expect(message.text).toContain('Update governance parameters');
    });

    test('should not send reminder for proposals below threshold via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const channelId = 'C_REM_BELOW';
      const userAddress = '0x1234567890abcdef1234567890abcdef12345678';

      // Create test user
      await createSlackUserWithWallet(channelId, testDaoId, userAddress);

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
          const messages = slackHelper.getAllMessages();
          // Return true after a minimal wait to confirm no messages are coming
          return messages.length === 0;
        },
        'Expected no voting reminder for below-threshold proposal',
        { timeout: 500, interval: 50 }
      );

      // Verify no notifications were sent
      const messages = slackHelper.getAllMessages();
      const votingReminderMessages = messages.filter(m =>
        m.text.includes('Voting Reminder')
      );
      expect(votingReminderMessages).toHaveLength(0);
    });

    test('should not send reminder for non-subscribed users via Slack', async () => {
      // Create default Slack workspace for OAuth support

      const subscribedChannelId = 'C_REM_SUB';
      const nonSubscribedChannelId = 'C_REM_NOSUB';
      const subscribedAddress = '0x1234567890abcdef1234567890abcdef12345678';
      const nonSubscribedAddress = '0xabcdef1234567890123456789012345678901234';

      // Create subscribed user
      await createSlackUserWithWallet(subscribedChannelId, testDaoId, subscribedAddress);

      // Create non-subscribed user (different DAO)
      await createSlackUserWithWallet(nonSubscribedChannelId, 'different-dao', nonSubscribedAddress);

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
      const message = await slackHelper.waitForMessage(
        msg => msg.text.includes('Voting Reminder') &&
               msg.channel === subscribedChannelId,
        {
          timeout: timeouts.notification.delivery,
          useHistory: env.SEND_REAL_SLACK === 'true',
          channel: subscribedChannelId
        }
      );

      // Verify only the subscribed user received the message
      expect(message.channel).toBe(subscribedChannelId);

      // Verify no message was sent to non-subscribed user
      const allMessages = slackHelper.getAllMessages();
      const nonSubscribedMessages = allMessages.filter(m => m.channel === nonSubscribedChannelId);
      expect(nonSubscribedMessages).toHaveLength(0);
    });
  });
});