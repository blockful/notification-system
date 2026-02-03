/**
 * Slack Vote Confirmation Trigger - Integration Test
 * Tests that vote confirmation notifications are correctly delivered via Slack
 * Supports both mock and real Slack delivery modes
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SlackTestClient } from '../../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../../src/config';
import { env } from '../../src/config/env';

describe('Slack Vote Confirmation Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  // Test configuration
  const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';

  // Helper function for creating Slack users with wallets
  const createSlackUserWithWallet = async (channelId: string, daoId: string, walletAddress: string) => {
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
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


  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();

    // Create Slack client and helper
    slackClient = new SlackTestClient(global.mockSlackSendMessage);
    slackHelper = new SlackTestHelper(global.mockSlackSendMessage, slackClient);

    dbHelper = new DatabaseTestHelper(db);
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send vote confirmation notification when user votes FOR via Slack', async () => {

    const channelId = 'C_VOTE_FOR_01';
    const voterAddress = testConstants.profiles.p1.address;

    // Create Slack user with subscription to DAO
    await createSlackUserWithWallet(channelId, testDaoId, voterAddress);

    // Create vote event with timestamp in the future to ensure processing
    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;

    const proposalTitle = 'Enable Community Grants Program';

    const voteEvents = [
      {
        daoId: testDaoId,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        proposalId: 'prop-for-123',
        voterAddress: voterAddress,
        support: 1, // FOR
        votingPower: '1000000000000000000000', // 1000 tokens
        timestamp: eventTimestamp,
        reason: 'Great proposal!',
        proposalTitle: proposalTitle
      }
    ];

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [], // No proposals needed
      [], // No voting power events
      { [testDaoId]: 1 }, // Map daoId to chainId
      voteEvents // Add votes to mock
    );

    // Wait for notification
    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('just voted on') &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack vote FOR confirmation not received',
        useHistory: env.SEND_REAL_SLACK,
        channel: channelId
      }
    );

    // Verify message content for FOR vote
    expect(message.channel).toBe(channelId);
    expect(message.text).toContain('✅'); // FOR emoji
    expect(message.text).toMatch(/voted FOR|just voted on/i);
    expect(message.text).toContain(proposalTitle);

    // Verify Slack link formatting
    if (message.text.includes('http')) {
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }
    expect(message.text).not.toContain('{{txLink}}');

    // Verify message has substantial content
    expect(message.text.length).toBeGreaterThan(50);

    // Verify database records
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 1);
  });

  test('should send vote confirmation notification when user votes AGAINST via Slack', async () => {

    const channelId = 'C_VOTE_AGN_01';
    const voterAddress = testConstants.profiles.p2.address;

    // Create Slack user with subscription to DAO
    await createSlackUserWithWallet(channelId, testDaoId, voterAddress);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;

    const proposalTitle = 'Increase Treasury Allocation';

    const voteEvents = [
      {
        daoId: testDaoId,
        transactionHash: '0x2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcdef2345',
        proposalId: 'prop-against-456',
        voterAddress: voterAddress,
        support: 0, // AGAINST
        votingPower: '5000000000000000000000', // 5000 tokens
        timestamp: eventTimestamp,
        reason: 'Needs more discussion',
        proposalTitle: proposalTitle
      }
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );

    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('just voted on') &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack vote AGAINST confirmation not received',
        useHistory: env.SEND_REAL_SLACK,
        channel: channelId
      }
    );

    // Verify message content for AGAINST vote
    expect(message.channel).toBe(channelId);
    expect(message.text).toContain('❌'); // AGAINST emoji
    expect(message.text).toMatch(/voted AGAINST|just voted on/i);
    expect(message.text).toContain(proposalTitle);

    // Verify Slack link formatting
    if (message.text.includes('http')) {
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

  });

  test('should send vote confirmation notification when user ABSTAINS via Slack', async () => {

    const channelId = 'C_VOTE_ABS_01';
    const voterAddress = testConstants.profiles.p3.address;

    // Create Slack user with subscription to DAO
    await createSlackUserWithWallet(channelId, testDaoId, voterAddress);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;

    const proposalTitle = 'Protocol Fee Adjustment';

    const voteEvents = [
      {
        daoId: testDaoId,
        transactionHash: '0x3456789012cdef3456789012cdef3456789012cdef3456789012cdef34567890',
        proposalId: 'prop-abstain-789',
        voterAddress: voterAddress,
        support: 2, // ABSTAIN
        votingPower: '2000000000000000000000', // 2000 tokens
        timestamp: eventTimestamp,
        // No reason provided for abstain
        proposalTitle: proposalTitle
      }
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );

    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('just voted on') &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack vote ABSTAIN confirmation not received',
        useHistory: env.SEND_REAL_SLACK,
        channel: channelId
      }
    );

    // Verify message content for ABSTAIN vote
    expect(message.channel).toBe(channelId);
    expect(message.text).toContain('⚪'); // ABSTAIN emoji
    expect(message.text).toMatch(/voted ABSTAIN|just voted on/i);
    expect(message.text).toContain(proposalTitle);

    // Verify Slack link formatting
    if (message.text.includes('http')) {
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

  });

  test('should NOT send duplicate notifications for same vote (txHash) via Slack', async () => {

    const channelId = 'C_VOTE_DUP_01';
    const voterAddress = testConstants.profiles.p1.address;

    // Create Slack user with subscription to DAO
    await createSlackUserWithWallet(channelId, testDaoId, voterAddress);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;
    const sameTxHash = '0x4567890123def4567890123def4567890123def4567890123def4567890123def';

    // Same vote event will be processed twice (simulating duplicate trigger)
    const voteEvents = [
      {
        daoId: testDaoId,
        transactionHash: sameTxHash,
        proposalId: 'prop-dup-123',
        voterAddress: voterAddress,
        support: 1,
        votingPower: '1000000000000000000000',
        timestamp: eventTimestamp,
        proposalTitle: 'Duplicate Test Proposal'
      }
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );

    // Wait for first notification
    const firstMessage = await slackHelper.waitForMessage(
      msg => msg.text.includes('just voted on') &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        useHistory: env.SEND_REAL_SLACK,
        channel: channelId
      }
    );

    expect(firstMessage).toBeDefined();
    expect(firstMessage.channel).toBe(channelId);

    // Reset triggers to force re-processing
    apps.logicSystemApp.resetTriggers();

    // Wait and verify no second notification is sent
    const startTime = Date.now();
    await slackHelper.waitForNoMessages(timeouts.wait.short);

    // Verify we waited for the timeout
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(timeouts.wait.short - 100);

    // Verify only one database record exists
    const notifications = await dbHelper.getNotifications();
    const slackNotifications = notifications.filter(n =>
      n.event_id.includes(sameTxHash)
    );
    expect(slackNotifications).toHaveLength(1);
  });

  test('should handle multiple votes from same user via Slack', async () => {

    const channelId = 'C_VOTE_MLT_01';
    const voterAddress = testConstants.profiles.p1.address;

    // Create Slack user with subscription to DAO
    await createSlackUserWithWallet(channelId, testDaoId, voterAddress);

    const baseTimestamp = Math.floor(Date.now() / 1000) + 10;

    // Create multiple vote events
    const voteEvents = [
      {
        daoId: testDaoId,
        transactionHash: '0x5678901234ef5678901234ef5678901234ef5678901234ef5678901234ef5678',
        proposalId: 'prop-multi-1',
        voterAddress: voterAddress,
        support: 1, // FOR
        votingPower: '1000000000000000000000',
        timestamp: baseTimestamp,
        proposalTitle: 'Multi Vote Proposal 1'
      },
      {
        daoId: testDaoId,
        transactionHash: '0x6789012345f6789012345f6789012345f6789012345f6789012345f6789012345',
        proposalId: 'prop-multi-2',
        voterAddress: voterAddress,
        support: 0, // AGAINST
        votingPower: '1000000000000000000000',
        timestamp: baseTimestamp + 1,
        proposalTitle: 'Multi Vote Proposal 2'
      },
      {
        daoId: testDaoId,
        transactionHash: '0x78901234567890123456789012345678901234567890123456789012345678ab',
        proposalId: 'prop-multi-3',
        voterAddress: voterAddress,
        support: 2, // ABSTAIN
        votingPower: '1000000000000000000000',
        timestamp: baseTimestamp + 2,
        proposalTitle: 'Multi Vote Proposal 3'
      }
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );

    // Wait for all three notifications
    await slackHelper.waitForMessageCount(
      3,
      {
        timeout: timeouts.notification.delivery,
        toChannel: channelId
      }
    );

    // Get all messages for this channel
    const allMessages = slackHelper.getAllMessages();
    const channelMessages = allMessages.filter(msg => msg.channel === channelId);

    // Verify all messages were received
    expect(channelMessages).toHaveLength(3);

    // Verify each vote type was received
    const hasFor = channelMessages.some(m => m.text.includes('✅'));
    const hasAgainst = channelMessages.some(m => m.text.includes('❌'));
    const hasAbstain = channelMessages.some(m => m.text.includes('⚪'));

    expect(hasFor).toBe(true);
    expect(hasAgainst).toBe(true);
    expect(hasAbstain).toBe(true);

    // Verify all messages are properly formatted
    channelMessages.forEach(message => {
      if (message.text.includes('http')) {
        expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
      }
    });

    // Verify database has all three notifications
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 3);
  });

  test('should NOT notify users not subscribed to DAO via Slack', async () => {

    const channelId = 'C_VOTE_NSB_01';
    const voterAddress = testConstants.profiles.p1.address;

    // Create user WITHOUT subscription to the test DAO
    await createSlackUserWithWallet(channelId, 'different-dao', voterAddress);

    const eventTimestamp = Math.floor(Date.now() / 1000) + 10;

    const voteEvents = [
      {
        daoId: testDaoId, // Vote is in testDaoId
        transactionHash: '0x890123456789012345678901234567890123456789012345678901234567890cd',
        proposalId: 'prop-nosub',
        voterAddress: voterAddress,
        support: 1,
        votingPower: '1000000000000000000000',
        timestamp: eventTimestamp,
        proposalTitle: 'No Subscription Proposal'
      }
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );

    // Ensure no messages are sent
    await slackHelper.waitForNoMessages(timeouts.wait.short);

    // Verify no notifications in database
    const notificationCount = await db(testConstants.tables.notifications).count('* as count');
    expect(notificationCount[0].count).toBe(0);
  });
});