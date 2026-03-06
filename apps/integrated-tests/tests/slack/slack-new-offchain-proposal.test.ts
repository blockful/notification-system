/**
 * Slack New Offchain Proposal Integration Test
 * Tests that Snapshot proposal notifications are correctly delivered via Slack
 */

import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, OffchainProposalFactory, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SlackTestClient } from '../../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../../src/config';

describe('Slack New Offchain Proposal - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = testConstants.daoIds.ens;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();

    slackClient = new SlackTestClient(global.mockSlackSendMessage);
    slackHelper = new SlackTestHelper(global.mockSlackSendMessage, slackClient);

    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send offchain proposal notification to Slack user', async () => {
    const channelId = 'C_OFFCHAIN_01';
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;

    const { user } = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_offchain_${channelId}`,
      testDaoId,
      true,
      undefined,
      'slack',
    );

    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-slack-${Date.now()}`, {
      title: 'Slack Snapshot Proposal',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const message = await slackHelper.waitForMessage(
      msg =>
        msg.text.includes('New Snapshot proposal') &&
        msg.text.includes(proposal.title) &&
        msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack offchain proposal notification not received',
      },
    );

    expect(message.channel).toBe(channelId);
    expect(message.text).toContain('New Snapshot proposal');
    expect(message.text).toContain(proposal.title);
    expect(message.text).toContain(testDaoId);

    if (message.text.includes('http')) {
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

    const notifications = await dbHelper.getNotifications();
    const slackNotification = notifications.find(
      n => n.user_id === user.id && n.event_id.includes(proposal.id),
    );
    expect(slackNotification).toBeDefined();
  });

  test('should deliver notification to multiple Slack users subscribed to the same DAO', async () => {
    const channel1 = 'C_OFFCHAIN_M1';
    const channel2 = 'C_OFFCHAIN_M2';
    const workspaceId = WorkspaceFactory.getWorkspaceId();

    await UserFactory.createUserWithFullSetup(
      `${workspaceId}:${channel1}`,
      `slack_offchain_${channel1}`,
      testDaoId,
      true,
      undefined,
      'slack',
    );

    await UserFactory.createUserWithFullSetup(
      `${workspaceId}:${channel2}`,
      `slack_offchain_${channel2}`,
      testDaoId,
      true,
      undefined,
      'slack',
    );

    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-multi-${Date.now()}`, {
      title: 'Multi-User Offchain Proposal',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const messages = await slackHelper.waitForMessageCount(2, {
      timeout: timeouts.notification.delivery,
      containing: proposal.title,
    });

    const channels = messages.map(m => m.channel);
    expect(channels).toContain(channel1);
    expect(channels).toContain(channel2);

    messages.forEach(message => {
      expect(message.text).toContain('New Snapshot proposal');
      expect(message.text).toContain(proposal.title);
    });
  });
});
