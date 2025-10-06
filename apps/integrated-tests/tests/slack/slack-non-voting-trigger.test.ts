/**
 * Slack Non-Voting Trigger Integration Test
 * Tests that non-voting alerts are correctly delivered via Slack
 * Supports both mock and real Slack delivery modes
 */

import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, ProposalFactory, VoteFactory, VoteData, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SlackTestClient } from '../../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../../src/config';
import { env } from '../../src/config/env';

describe('Slack Non-Voting Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  // Test addresses
  const ADDRESS_ACTIVE = '0x1234567890123456789012345678901234567890';
  const ADDRESS_PARTIAL = '0xabcdef1234567890123456789012345678901234';
  const ADDRESS_INACTIVE = '0xb8c2C29ee19D8307cb7255e1Cd9CbDE883A267d5'.toLowerCase(); // nick.eth
  const ADDRESS_ZERO_VOTES = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'.toLowerCase(); // vitalik.eth

  // Helper function for creating Slack users with followed addresses
  const createSlackUserWithFollowedAddresses = async (
    channelId: string,
    username: string,
    daoId: string,
    addresses: string[],
    isActive?: boolean,
    timestamp?: string
  ) => {
    const workspaceId = env.SEND_REAL_SLACK === 'true' ? env.SLACK_WORKSPACE_ID! : WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    const result = await UserFactory.createUserWithFollowedAddresses(
      slackUserId,
      username,
      daoId,
      addresses,
      isActive ?? true,
      timestamp,
      'slack'
    );
    return result.user;
  };

  // Test configuration
  const SLACK_CHANNEL_ID = env.SLACK_TEST_CHANNEL_ID || 'C1234567890';
  const SLACK_CHANNEL_2 = 'C2222222222';
  const SLACK_CHANNEL_3 = 'C3333333333';

  // Helper to create finished proposals (similar to Telegram test)
  const createFinishedProposals = (daoId: string, count: number) => {
    const now = Date.now();
    return Array.from({ length: count }, (_, i) => {
      const proposalId = `proposal-${count - i}`;
      // CRITICAL: Logic System is initialized with timestamps from one year ago
      // So proposals must have creation timestamps within the last year to be detected
      // The ProposalFinishedTrigger filters by creation timestamp (not end timestamp)
      const proposalCreationTime = now - (30 * 24 * 60 * 60 * 1000); // 30 days ago - well within the 1 year window
      const proposalEndTime = now - (10000 + i * 5000); // 10 seconds ago, staggered

      const startBlock = testConstants.proposalTiming.defaultStartBlock + (i * 10);
      const blocksToRun = Math.floor(testConstants.proposalTiming.proposalRunDuration / testConstants.defaults.blockTime);
      const endBlock = startBlock + blocksToRun;

      return ProposalFactory.createProposal(daoId, proposalId, {
        title: `Proposal ${count - i}`,
        status: 'EXECUTED',
        timestamp: Math.floor(proposalCreationTime / 1000).toString(),
        startBlock: startBlock,
        endBlock: endBlock,
        endTimestamp: Math.floor(proposalEndTime / 1000).toString()
      });
    });
  };

  // Helper to format expected non-voting message in Slack mrkdwn format
  const formatNonVotingMessage = (address: string, daoId: string, proposals: any[]) => {
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
    const proposalList = proposals
      .slice(0, 3)
      .map(p => `• ${p.title}`)
      .join('\n');

    return `⚠️ Non-Voting Alert for DAO ${daoId.toUpperCase()}

The address ${shortAddress} that you follow hasn't voted in the last 3 proposals:

${proposalList}

Consider reaching out to encourage participation!`;
  };


  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();

    // Create Slack client and helper
    slackClient = new SlackTestClient(global.mockSlackSendMessage);
    slackHelper = new SlackTestHelper(global.mockSlackSendMessage, slackClient);

    dbHelper = new DatabaseTestHelper(db);

    // Workspace is now created in global setup
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('Basic non-voting scenario - only completely inactive address gets notification', async () => {
    const testDaoId = testConstants.daoIds.temporalTest1;

    // Create Slack user following 3 addresses
    const user = await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_user_1',
      testDaoId,
      [ADDRESS_ACTIVE, ADDRESS_PARTIAL, ADDRESS_INACTIVE]
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);

    // Create votes: ADDRESS_ACTIVE voted on all, ADDRESS_PARTIAL on one, ADDRESS_INACTIVE on none
    const votes: VoteData[] = [
      ...VoteFactory.createVotesForProposals(ADDRESS_ACTIVE, ['proposal-1', 'proposal-2', 'proposal-3'], testDaoId),
      VoteFactory.createVote(ADDRESS_PARTIAL, 'proposal-2', testDaoId)
    ];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait for notification - should only be for ADDRESS_INACTIVE (nick.eth)
    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('Non-Voting Alert') &&
             msg.text.includes('nick.eth') &&
             msg.channel === SLACK_CHANNEL_ID,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack non-voting notification not received',
        useHistory: env.SEND_REAL_SLACK === 'true',
        channel: SLACK_CHANNEL_ID
      }
    );

    expect(message.channel).toBe(SLACK_CHANNEL_ID);
    expect(message.text).toContain('hasn\'t voted in the last 3 proposals');
    expect(message.text).toContain('nick.eth');
    expect(message.text).not.toContain(ADDRESS_ACTIVE.slice(0, 6));
    expect(message.text).not.toContain(ADDRESS_PARTIAL.slice(0, 6));

    // Verify Slack formatting (markdown should be converted to mrkdwn)
    // Check that we're using Slack's single asterisks for bold
    if (message.text.includes('*')) {
      expect(message.text).not.toContain('**'); // Should not have Telegram's double asterisks
    }

  });

  test('Edge case - less than 3 proposals, no notifications', async () => {
    const testDaoId = testConstants.daoIds.temporalTest2;

    // Create Slack user following an address
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_user_2',
      testDaoId,
      [ADDRESS_INACTIVE]
    );

    // Create only 2 finished proposals
    const proposals = createFinishedProposals(testDaoId, 2);

    // No votes
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait and verify no messages are sent
    await slackHelper.waitForNoMessages(3000);
  });

  test('Multiple users following same non-voting address', async () => {
    const testDaoId = testConstants.daoIds.temporalTest3;

    // Create two Slack users following the same address
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_user_one',
      testDaoId,
      [ADDRESS_INACTIVE]
    );

    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_2,
      'slack_user_two',
      testDaoId,
      [ADDRESS_INACTIVE]
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);

    // No votes for ADDRESS_INACTIVE
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait for both notifications
    const messages = await slackHelper.waitForMessageCount(
      2,
      {
        timeout: timeouts.notification.delivery,
        containing: 'Non-Voting Alert'
      }
    );

    // Verify both users received notifications
    const channels = messages.map(m => m.channel);
    expect(channels).toContain(SLACK_CHANNEL_ID);
    expect(channels).toContain(SLACK_CHANNEL_2);

    // Verify content - should show nick.eth
    messages.forEach(message => {
      expect(message.text).toContain('nick.eth');
      expect(message.text).toContain('hasn\'t voted in the last 3 proposals');
    });
  });

  test('Partial voting does NOT generate notification', async () => {
    const testDaoId = testConstants.daoIds.temporalTest4;

    // Create Slack user following 3 addresses with different voting patterns
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_user_partial',
      testDaoId,
      [ADDRESS_ACTIVE, ADDRESS_PARTIAL, ADDRESS_ZERO_VOTES]
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);

    // Create votes:
    // ADDRESS_ACTIVE voted on 2/3
    // ADDRESS_PARTIAL voted on 1/3
    // ADDRESS_ZERO_VOTES voted on 0/3
    const votes: VoteData[] = [
      VoteFactory.createVote(ADDRESS_ACTIVE, 'proposal-1', testDaoId),
      VoteFactory.createVote(ADDRESS_ACTIVE, 'proposal-3', testDaoId),
      VoteFactory.createVote(ADDRESS_PARTIAL, 'proposal-2', testDaoId)
    ];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Should only get notification for ADDRESS_ZERO_VOTES (vitalik.eth)
    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('Non-Voting Alert') &&
             msg.channel === SLACK_CHANNEL_ID,
      { timeout: timeouts.notification.delivery }
    );

    expect(message.text).toContain('vitalik.eth');
    expect(message.text).not.toContain(ADDRESS_ACTIVE.slice(0, 6));
    expect(message.text).not.toContain(ADDRESS_PARTIAL.slice(0, 6));
  });

  test('No followed addresses - no processing', async () => {
    const testDaoId = testConstants.daoIds.temporalTest5;

    // Create Slack user with subscription but no followed addresses
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${SLACK_CHANNEL_ID}`;
    await UserFactory.createUserWithFullSetup(
      slackUserId,
      'slack_user_no_addresses',
      testDaoId,
      true,
      undefined,
      'slack' // Specify slack channel
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, []);

    // Wait and verify no messages are sent
    await slackHelper.waitForNoMessages(3000);
  });

  test('Multiple DAOs - isolation between DAOs', async () => {
    const dao1 = 'uni';
    const dao2 = 'ens';

    // Slack User 1 follows address in DAO1
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_dao1_user',
      dao1,
      [ADDRESS_INACTIVE]
    );

    // Slack User 2 follows different address in DAO2
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_2,
      'slack_dao2_user',
      dao2,
      [ADDRESS_ZERO_VOTES]
    );

    // Create proposals for both DAOs
    const dao1Proposals = createFinishedProposals(dao1, 3);
    const dao2Proposals = createFinishedProposals(dao2, 3);

    // No votes in either DAO
    const votes: VoteData[] = [];

    // Setup mocks with both DAOs' proposals
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [...dao1Proposals, ...dao2Proposals],
      [],
      {},
      votes
    );

    // Wait for notifications
    const messages = await slackHelper.waitForMessageCount(
      2,
      {
        timeout: timeouts.notification.delivery * 2,
        containing: 'Non-Voting Alert'
      }
    );

    // Verify correct DAO isolation
    const dao1Message = messages.find(m => m.channel === SLACK_CHANNEL_ID);
    const dao2Message = messages.find(m => m.channel === SLACK_CHANNEL_2);

    expect(dao1Message?.text).toContain('DAO UNI');
    expect(dao1Message?.text).toContain('nick.eth');

    expect(dao2Message?.text).toContain('DAO ENS');
    expect(dao2Message?.text).toContain('vitalik.eth');
  });

  test('Duplicate prevention - same address in multiple events', async () => {
    const testDaoId = testConstants.daoIds.temporalTest8;

    // Create Slack user following an address
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_test_duplicate',
      testDaoId,
      [ADDRESS_INACTIVE]
    );

    // Create 4 proposals (to trigger multiple checks)
    // Only proposal-4 and proposal-3 will have 3 prior proposals to check
    const proposals = createFinishedProposals(testDaoId, 4);

    // No votes
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Should receive 2 notifications: one for proposal-4 and one for proposal-3
    const messages = await slackHelper.waitForMessageCount(
      2,
      {
        timeout: timeouts.notification.delivery,
        containing: 'Non-Voting Alert'
      }
    );

    // Verify both messages are for the same channel
    expect(messages[0].channel).toBe(SLACK_CHANNEL_ID);
    expect(messages[1].channel).toBe(SLACK_CHANNEL_ID);

    // Check database for proper event_id deduplication
    const notifications = await dbHelper.getNotifications();
    const nonVotingNotifications = notifications.filter(n =>
      n.event_id.includes('non-voting')
    );

    // Should have 2 unique event_ids: one for proposal-4 and one for proposal-3
    expect(nonVotingNotifications.length).toBe(2);

    // Verify event IDs contain the address and are unique
    const eventIds = nonVotingNotifications.map(n => n.event_id);
    expect(eventIds[0]).toContain(ADDRESS_INACTIVE);
    expect(eventIds[1]).toContain(ADDRESS_INACTIVE);
    expect(eventIds[0]).toContain('non-voting');
    expect(eventIds[1]).toContain('non-voting');

    // Event IDs should be different (one for proposal-4, one for proposal-3)
    expect(new Set(eventIds).size).toBe(2);
  });

  test('Slack formatting for non-voting messages', async () => {
    const testDaoId = 'test-formatting-dao';

    // Create Slack user following an address
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_3,
      'slack_formatting_test',
      testDaoId,
      [ADDRESS_INACTIVE]
    );

    // Create 3 proposals with markdown-style titles
    const proposals = [
      ProposalFactory.createProposal(testDaoId, 'proposal-1', {
        title: 'Proposal with **Bold Text**',
        status: 'EXECUTED',
        endTimestamp: Math.floor((Date.now() - 1000) / 1000).toString()
      }),
      ProposalFactory.createProposal(testDaoId, 'proposal-2', {
        title: 'Proposal with __Underline__',
        status: 'EXECUTED',
        endTimestamp: Math.floor((Date.now() - 2000) / 1000).toString()
      }),
      ProposalFactory.createProposal(testDaoId, 'proposal-3', {
        title: 'Regular Proposal Title',
        status: 'EXECUTED',
        endTimestamp: Math.floor((Date.now() - 3000) / 1000).toString()
      })
    ];

    // No votes
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait for Slack notification
    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('Non-Voting Alert') &&
             msg.channel === SLACK_CHANNEL_3,
      { timeout: timeouts.notification.delivery }
    );

    // Verify Telegram markdown was converted to Slack mrkdwn
    expect(message.text).toContain('*Bold Text*'); // Single asterisk for Slack
    expect(message.text).not.toContain('**Bold Text**'); // No double asterisks
    expect(message.text).toContain('_Underline_'); // Slack uses single underscore for italics
    expect(message.text).not.toContain('__Underline__'); // No double underscores
    expect(message.text).toContain('Regular Proposal Title');
  });

  test('Slack with Telegram coexistence for non-voting alerts', async () => {
    const testDaoId = 'cross-platform-dao';

    // Create one Slack user and one Telegram user following same address
    await createSlackUserWithFollowedAddresses(
      SLACK_CHANNEL_ID,
      'slack_cross_platform',
      testDaoId,
      [ADDRESS_INACTIVE]
    );

    await UserFactory.createUserWithFollowedAddresses(
      testConstants.profiles.p1.chatId,
      'telegram_cross_platform',
      testDaoId,
      [ADDRESS_INACTIVE],
      true,
      'telegram' // Explicitly set telegram channel
    );

    // Create 3 finished proposals
    const proposals = createFinishedProposals(testDaoId, 3);

    // No votes for ADDRESS_INACTIVE
    const votes: VoteData[] = [];

    // Setup mocks
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals, [], {}, votes);

    // Wait for Slack notification
    const slackMessage = await slackHelper.waitForMessage(
      msg => msg.text.includes('Non-Voting Alert') &&
             msg.channel === SLACK_CHANNEL_ID,
      { timeout: timeouts.notification.delivery }
    );

    // Verify Slack message - should show nick.eth
    expect(slackMessage.channel).toBe(SLACK_CHANNEL_ID);
    expect(slackMessage.text).toContain('nick.eth');
    expect(slackMessage.text).toContain('hasn\'t voted in the last 3 proposals');

    // Verify Telegram also received (checking mock calls) - should show nick.eth
    const telegramCalls = global.mockTelegramSendMessage.mock.calls;
    const telegramMessage = telegramCalls.find(([chatId, text]) =>
      text.includes('Non-Voting Alert') &&
      text.includes('nick.eth') &&
      chatId.toString() === testConstants.profiles.p1.chatId
    );
    expect(telegramMessage).toBeDefined();

    // Verify database has both notifications
    const notifications = await dbHelper.getNotifications();
    const nonVotingNotifications = notifications.filter(n =>
      n.event_id.includes('non-voting') && n.event_id.includes(ADDRESS_INACTIVE)
    );

    // Should have notifications for both platforms
    expect(nonVotingNotifications.length).toBeGreaterThanOrEqual(2);
  });
});