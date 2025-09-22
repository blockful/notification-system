/**
 * Slack New Proposal Integration Test
 * Tests that new proposal notifications are correctly delivered via Slack
 * Supports both mock and real Slack delivery modes
 */

import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory, WorkspaceFactory } from '../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { SlackTestClient } from '../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../src/config';
import { env } from '../src/config/env';

describe('Slack New Proposal - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  // Test configuration
  const SLACK_CHANNEL_ID = env.SLACK_TEST_CHANNEL_ID || 'C1234567890';
  const TEST_DAO_ID = 'test-dao';

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();

    // Create Slack client and helper
    slackClient = new SlackTestClient(global.mockSlackSendMessage);
    slackHelper = new SlackTestHelper(global.mockSlackSendMessage, slackClient);

    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();

    // Create default Slack workspace for OAuth support
    await WorkspaceFactory.createDefaultSlackWorkspace();
  });

  /**
   * Helper to create a Slack user with subscription
   */
  const createSlackUser = async (channelId: string, daoId: string) => {
    // Use workspace:user format for Slack OAuth support
    const slackUserId = `T_DEFAULT:${channelId}`;

    const result = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      daoId,
      true,
      undefined,
      'slack' // Specify slack as the channel
    );
    return result.user;
  };

  test('New proposal notification delivered to Slack', async () => {
    // Create a Slack user subscribed to the test DAO first
    const user = await createSlackUser(SLACK_CHANNEL_ID, TEST_DAO_ID);

    // Create a new proposal with timestamp 5 seconds in the future to ensure it's detected
    const proposalId = `proposal-${Date.now()}`;
    const futureTimestamp = Math.floor((Date.now() + 5000) / 1000);
    const proposal = ProposalFactory.createProposal(TEST_DAO_ID, proposalId, {
      title: `Test Proposal for Slack ${Date.now()}`,
      status: 'ACTIVE',
      timestamp: futureTimestamp.toString(),
      startBlock: 100000,
      endBlock: 200000,
      endTimestamp: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000).toString()
    });

    // Setup GraphQL mock to return the proposal
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [proposal], [], {}, []);

    // Wait for Slack notification
    const message = await slackHelper.waitForMessage(
      msg => {
        return msg.text.includes('New governance proposal') &&
               msg.text.includes(proposal.title || '') &&
               msg.channel === SLACK_CHANNEL_ID;
      },
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack notification not received',
        useHistory: env.SEND_REAL_SLACK === 'true', // Use history API in real mode
        channel: SLACK_CHANNEL_ID // Pass channel explicitly for history mode
      }
    );

    // Verify message was sent to correct channel
    expect(message.channel).toBe(SLACK_CHANNEL_ID);

    // Verify message content
    expect(message.text).toContain('New governance proposal');
    expect(message.text).toContain(proposal.title);
    expect(message.text).toContain(TEST_DAO_ID);

    // Verify Slack-specific formatting (links should be in Slack format)
    if (message.text.includes('http')) {
      // Slack links should be in <url|text> format after conversion
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

    // In real mode, also verify through conversations.history
    if (env.SEND_REAL_SLACK === 'true') {
      const history = await slackClient.getMessageHistory(SLACK_CHANNEL_ID, 10);
      const foundMessage = history.find(msg =>
        msg.text?.includes(proposal.title)
      );
      expect(foundMessage).toBeDefined();
      console.log('✅ Real Slack message delivered and verified via conversations.history');
    }

    // Verify database records
    const notifications = await dbHelper.getNotifications();
    const slackNotification = notifications.find(n =>
      n.user_id === user.id &&
      n.event_id.includes(proposalId)
    );
    expect(slackNotification).toBeDefined();
    expect(slackNotification?.event_id).toContain(proposalId);
  });

  test('Slack formatting conversion works correctly', async () => {
    // Create a Slack user
    await createSlackUser(SLACK_CHANNEL_ID, TEST_DAO_ID);

    // Wait a bit to ensure user is properly saved and indexed
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create a proposal with markdown-style content that needs conversion
    const proposalId = `proposal-formatting-${Date.now()}`;
    const futureTimestamp = Math.floor((Date.now() + 5000) / 1000);
    const proposal = ProposalFactory.createProposal(TEST_DAO_ID, proposalId, {
      title: 'Proposal with **Bold Text** and Links',
      status: 'ACTIVE',
      timestamp: futureTimestamp.toString(),
      startBlock: 100000,
      endBlock: 200000,
      endTimestamp: Math.floor((Date.now() + 7 * 24 * 60 * 60 * 1000) / 1000).toString()
    });

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [proposal], [], {}, []);

    // Wait for Slack notification
    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('Bold Text') && msg.channel === SLACK_CHANNEL_ID,
      { timeout: timeouts.notification.delivery }
    );

    // Verify Telegram markdown was converted to Slack mrkdwn
    // **Bold Text** should become *Bold Text*
    expect(message.text).toContain('*Bold Text*');
    expect(message.text).not.toContain('**Bold Text**');
  });

  test('Multiple Slack users receive notifications', async () => {
    const channel1 = 'C1111111111';
    const channel2 = 'C2222222222';

    // Create two Slack users subscribed to the same DAO
    await createSlackUser(channel1, TEST_DAO_ID);
    await createSlackUser(channel2, TEST_DAO_ID);

    // Create a new proposal with future timestamp
    const proposalId = `proposal-multi-${Date.now()}`;
    const futureTimestamp = Math.floor((Date.now() + 5000) / 1000);
    const proposal = ProposalFactory.createProposal(TEST_DAO_ID, proposalId, {
      title: `Multi-User Proposal ${Date.now()}`,
      status: 'ACTIVE',
      timestamp: futureTimestamp.toString(),
      startBlock: 100000,
      endBlock: 200000
    });

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [proposal], [], {}, []);

    // Wait for both notifications
    const messages = await slackHelper.waitForMessageCount(
      2,
      {
        timeout: timeouts.notification.delivery,
        containing: proposal.title
      }
    );

    // Verify both channels received messages
    const channels = messages.map(m => m.channel);
    expect(channels).toContain(channel1);
    expect(channels).toContain(channel2);

    // Verify content is identical for both
    messages.forEach(message => {
      expect(message.text).toContain('New governance proposal');
      expect(message.text).toContain(proposal.title);
    });
  });

  test('Slack and Telegram users coexist without interference', async () => {
    // Create one Slack user and one Telegram user for the same DAO
    await createSlackUser(SLACK_CHANNEL_ID, TEST_DAO_ID);
    await UserFactory.createUserWithFullSetup(
      testConstants.profiles.p1.chatId,
      'telegram_user',
      TEST_DAO_ID,
      true,
      undefined,
      'telegram' // Explicitly set telegram channel
    );

    // Create a new proposal with timestamp 5 seconds in the future
    const proposalId = `proposal-mixed-${Date.now()}`;
    const futureTimestamp = Math.floor((Date.now() + 5000) / 1000);
    const proposal = ProposalFactory.createProposal(TEST_DAO_ID, proposalId, {
      title: `Cross-Platform Proposal ${Date.now()}`,
      status: 'ACTIVE',
      timestamp: futureTimestamp.toString()
    });

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [proposal], [], {}, []);

    // Wait for Slack notification
    const slackMessage = await slackHelper.waitForMessage(
      msg => msg.text.includes(proposal.title || '') && msg.channel === SLACK_CHANNEL_ID,
      { timeout: timeouts.notification.delivery }
    );

    // Verify Slack message
    expect(slackMessage.channel).toBe(SLACK_CHANNEL_ID);
    expect(slackMessage.text).toContain(proposal.title);

    // Verify Telegram also received (checking mock calls)
    const telegramCalls = global.mockTelegramSendMessage.mock.calls;
    const telegramMessage = telegramCalls.find(([chatId, text]) =>
      text.includes(proposal.title) &&
      chatId.toString() === testConstants.profiles.p1.chatId
    );
    expect(telegramMessage).toBeDefined();

    // Verify database has both notifications
    const notifications = await dbHelper.getNotifications();

    // Find notifications by user_id instead of channel
    const slackUser = await db(testConstants.tables.users).where({
      channel_user_id: `T_DEFAULT:${SLACK_CHANNEL_ID}`,
      channel: 'slack'
    }).first();
    const telegramUser = await db(testConstants.tables.users).where({
      channel_user_id: testConstants.profiles.p1.chatId,
      channel: 'telegram'
    }).first();

    const slackNotif = notifications.find(n => n.user_id === slackUser.id);
    const telegramNotif = notifications.find(n => n.user_id === telegramUser.id);

    expect(slackNotif).toBeDefined();
    expect(telegramNotif).toBeDefined();
    expect(slackNotif?.event_id).toBe(telegramNotif?.event_id); // Same event
  });
});