/**
 * Slack Proposal Finished Trigger - Integration Test
 * Tests that proposal finished notifications are correctly delivered via Slack
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

describe('Slack Proposal Finished Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  // Helper function - identical to Telegram version
  const createFinishedProposal = (daoId: string, proposalId: string, baseTime?: Date) => {
    // Create a proposal that finished 10 seconds ago
    const now = Date.now();
    const proposalCreationTime = new Date(now + testConstants.proposalTiming.creationOffset);
    const proposalEndTime = now + testConstants.proposalTiming.finishOffset * 1000; // 10 seconds ago

    // For a 12-second block time:
    // Proposal created at block 1000, voting starts immediately (no delay)
    // Needs to run for 50 seconds to finish 10 seconds ago
    const startBlock = testConstants.proposalTiming.defaultStartBlock;
    const blocksToRun = Math.floor(testConstants.proposalTiming.proposalRunDuration / testConstants.defaults.blockTime);
    const endBlock = startBlock + blocksToRun;

    return ProposalFactory.createProposal(daoId, proposalId, {
      timestamp: Math.floor(proposalCreationTime.getTime() / 1000).toString(),
      startBlock: startBlock,
      endBlock: endBlock,
      endTimestamp: Math.floor(proposalEndTime / 1000).toString(), // Finished 10 seconds ago
      status: 'EXECUTED',
      description: `# Finished Proposal\n\nThis proposal has ended.`
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

  test('should send notification when proposal finishes via Slack', async () => {

    const testDaoId = testConstants.daoIds.temporalTest1;
    const channelId = 'C_FINISHED_01';

    // Create user with subscription before proposal
    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      subscriptionTime,
      'slack'
    );

    // Create a proposal that has already finished
    const proposal = createFinishedProposal(testDaoId, 'finishing-proposal-1');

    // Setup mock to return the finished proposal
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [proposal], []);

    // Wait for the notification to be sent
    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('has ended') &&
             msg.text.includes(testDaoId) &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack proposal finished notification not received',
        useHistory: env.SEND_REAL_SLACK === 'true',
        channel: channelId
      }
    );

    // Verify message content
    expect(message.channel).toBe(channelId);
    expect(message.text).toContain('has ended');
    expect(message.text).toMatch(/📊 Proposal .* has ended on DAO/);

    // Verify Slack formatting - links should be in <url|text> format if present
    if (message.text.includes('http')) {
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

    // Verify message has substantial content
    expect(message.text.length).toBeGreaterThan(50);


    // Verify database record
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 1);
  });

  test('should NOT send notification for proposals that have not finished yet via Slack', async () => {

    const testDaoId = testConstants.daoIds.temporalTest1;
    const channelId = 'C_FUTURE_01';

    // Create user with subscription with current timestamp (not offset)
    const currentTime = new Date().toISOString();
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      currentTime,
      'slack'
    );

    // Create a proposal that will finish in the future
    const now = Math.floor(Date.now() / 1000);
    const futureProposal = ProposalFactory.createProposal(testDaoId, 'future-proposal-1', {
      timestamp: (now - 10).toString(), // Created 10 seconds ago
      startBlock: testConstants.proposalTiming.defaultStartBlock,
      endBlock: testConstants.proposalTiming.defaultStartBlock + testConstants.proposalTiming.futureProposalBlocks, // Will finish in ~1080 seconds
      status: 'ACTIVE',
      description: '# Future Proposal\n\nThis proposal will not finish during the test.'
    });

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [futureProposal], []);

    // Ensure no messages are sent
    await slackHelper.waitForNoMessages(timeouts.notification.processing);

    // Verify no notifications in database
    const notificationCount = await db(testConstants.tables.notifications).count('* as count');
    expect(notificationCount[0].count).toBe(0);
  });

  test('should process multiple finished proposals via Slack', async () => {

    const testDaoId = testConstants.daoIds.temporalTest1;
    const channelId = 'C_MULTIPLE_01';

    // Create user with subscription
    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      subscriptionTime,
      'slack'
    );

    // Create multiple finished proposals with incremental timestamps
    const baseTime = new Date(Date.now() - testConstants.proposalTiming.finishOffset * 1000);
    const proposals = [
      createFinishedProposal(testDaoId, 'finished-1', baseTime),
      createFinishedProposal(testDaoId, 'finished-2', new Date(baseTime.getTime() + 1000)),
      createFinishedProposal(testDaoId, 'finished-3', new Date(baseTime.getTime() + 2000))
    ];

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, []);

    // Wait for all 3 messages
    await slackHelper.waitForMessageCount(3, {
      timeout: timeouts.notification.delivery,
      fromChannel: channelId
    });

    // Verify messages content
    const allMessages = slackHelper.getAllMessages();
    const channelMessages = allMessages.filter(msg => msg.channel === channelId);

    expect(channelMessages).toHaveLength(3);
    expect(channelMessages[0].text).toContain('has ended');
    expect(channelMessages[1].text).toContain('has ended');
    expect(channelMessages[2].text).toContain('has ended');

    // Verify all messages are about finished proposals
    expect(channelMessages.every(msg => msg.text.includes('has ended'))).toBe(true);
    expect(channelMessages.every(msg => msg.text.match(/📊 Proposal .* has ended on DAO/))).toBe(true);

    // Verify Slack formatting
    channelMessages.forEach(message => {
      if (message.text.includes('http')) {
        expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
      }
    });

    // Verify database records
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 3);
  });

  test('should NOT notify about proposals that finished before user subscription via Slack', async () => {

    const testDaoId = testConstants.daoIds.temporalTest1;
    const channelId = 'C_OLD_PROP_01';

    // Define clear timeline
    const baseTime = new Date(testConstants.testDates.baseTime);
    const proposalCreatedAt = new Date(testConstants.testDates.proposalCreatedAt); // 2 hours before
    const userSubscribedAt = baseTime; // Now

    // Create user with subscription at specific time
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      userSubscribedAt.toISOString(),
      'slack'
    );

    // Create proposal that was created and finished before user subscription
    const oldProposal = ProposalFactory.createProposal(testDaoId, 'old-finished-proposal', {
      timestamp: Math.floor(proposalCreatedAt.getTime() / 1000).toString(),
      endTimestamp: Math.floor(proposalCreatedAt.getTime() / 1000 + 3600).toString(), // Ended 1 hour after creation, still before subscription
      startBlock: testConstants.proposalTiming.defaultStartBlock,
      endBlock: testConstants.proposalTiming.defaultStartBlock + 1, // Finished quickly (1 block = 12 seconds)
      status: 'EXECUTED',
      description: '# Old Proposal\n\nThis finished before user subscribed.'
    });

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [oldProposal], []);

    // Ensure no messages are sent
    await slackHelper.waitForNoMessages(timeouts.notification.processing);

    // Verify no notifications in database
    const notificationCount = await db(testConstants.tables.notifications).count('* as count');
    expect(notificationCount[0].count).toBe(0);
  });

  test('should handle proposals from multiple DAOs via Slack', async () => {

    const dao1Id = testConstants.daoIds.temporalTest1;
    const dao2Id = testConstants.daoIds.temporalTest2;
    const channelId = 'C_MULTI_DAO_01';

    // Create user with subscriptions to both DAOs
    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    const { user } = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      dao1Id,
      true,
      subscriptionTime,
      'slack'
    );

    // Add second DAO subscription
    await UserFactory.createUserPreference(
      user.id,
      dao2Id,
      true,
      subscriptionTime
    );

    // Create finished proposals for each DAO with incremental timestamps
    const baseTime = new Date(Date.now() - testConstants.proposalTiming.finishOffset * 1000);
    const dao1Proposal = createFinishedProposal(dao1Id, 'dao1-finished', baseTime);
    const dao2Proposal = createFinishedProposal(dao2Id, 'dao2-finished', new Date(baseTime.getTime() + 1000)); // 1 second later

    // Setup mock
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [dao1Proposal, dao2Proposal], []);

    // Wait for 2 messages (one for each DAO)
    await slackHelper.waitForMessageCount(2, {
      timeout: timeouts.notification.delivery,
      fromChannel: channelId
    });

    // Verify messages content
    const allMessages = slackHelper.getAllMessages();
    const channelMessages = allMessages.filter(msg => msg.channel === channelId);

    expect(channelMessages).toHaveLength(2);

    // Verify each DAO's proposal is mentioned
    const dao1Message = channelMessages.find(msg => msg.text.includes(dao1Id));
    const dao2Message = channelMessages.find(msg => msg.text.includes(dao2Id));

    expect(dao1Message).toBeDefined();
    expect(dao1Message?.text).toContain('has ended');
    expect(dao1Message?.text).toMatch(/📊 Proposal .* has ended on DAO/);

    expect(dao2Message).toBeDefined();
    expect(dao2Message?.text).toContain('has ended');
    expect(dao2Message?.text).toMatch(/📊 Proposal .* has ended on DAO/);

    // Verify Slack formatting
    [dao1Message, dao2Message].forEach(message => {
      if (message && message.text.includes('http')) {
        expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
      }
    });

    // Verify database records
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 2);
  });
});