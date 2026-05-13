import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { offchainProposalsHandler } from '@anticapture/client/msw';
import { offchainProposalStatusListEnum } from '@notification-system/anticapture-client';
import { db, TestApps } from '../../src/setup';
import { server } from '../../src/setup/msw-server';
import { UserFactory, OffchainProposalFactory, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SimpleSlackClient } from '../../src/test-clients/simple-slack.client';
import { testConstants, timeouts } from '../../src/config';
import { env } from '../../src/config/env';

describe('Slack Offchain Proposal Finished Trigger - Integration Test', () => {
  let apps: TestApps;

  let slackHelper: SlackTestHelper;
  let slackClient: SimpleSlackClient;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = testConstants.daoIds.ens;

  const createFinishedOffchainProposal = (daoId: string, proposalId: string, overrides?: Partial<ReturnType<typeof OffchainProposalFactory.createProposal>>) => {
    const now = Math.floor(Date.now() / 1000);
    return OffchainProposalFactory.createProposal(daoId, proposalId, {
      state: offchainProposalStatusListEnum.closed,
      created: now - 7 * 24 * 60 * 60,
      end: now - 10,
      title: `Finished Snapshot Proposal ${proposalId}`,
      link: `https://snapshot.org/#/${daoId}/proposal/${proposalId}`,
      ...overrides,
    });
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();


    slackClient = global.slackClient;
    slackHelper = new SlackTestHelper(global.slackClient);

    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send notification when offchain proposal finishes via Slack', async () => {
    const channelId = 'C_OFF_FIN_01';
    const proposalId = 'snap-finished-slack-1';

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

    const proposal = createFinishedOffchainProposal(testDaoId, proposalId);

    server.use(offchainProposalsHandler({ items: [proposal], totalCount: 1 }));

    const message = await slackHelper.waitForMessage(
      msg => msg.text.includes('has ended') &&
             msg.text.includes('Snapshot proposal') &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack offchain proposal finished notification not received',
        useHistory: env.SEND_REAL_SLACK,
        channel: channelId
      }
    );

    expect(message.channel).toBe(channelId);
    expect(message.text).toBe(`📊 Snapshot proposal "Finished Snapshot Proposal ${proposalId}" has ended on DAO ${testDaoId}`);

    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 1);
  });

  test('should process multiple finished offchain proposals via Slack', async () => {
    const channelId = 'C_OFF_MULTI_01';

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

    const now = Math.floor(Date.now() / 1000);
    const proposals = [
      createFinishedOffchainProposal(testDaoId, 'snap-fin-slack-1', { end: now - 10 }),
      createFinishedOffchainProposal(testDaoId, 'snap-fin-slack-2', { end: now - 9 }),
      createFinishedOffchainProposal(testDaoId, 'snap-fin-slack-3', { end: now - 8 }),
    ];

    server.use(offchainProposalsHandler({ items: proposals, totalCount: proposals.length }));

    await slackHelper.waitForMessageCount(3, {
      timeout: timeouts.notification.delivery,
      fromChannel: channelId
    });

    const allMessages = slackHelper.getAllMessages();
    const channelMessages = allMessages.filter(msg => msg.channel === channelId);

    expect(channelMessages).toHaveLength(3);
    const messageTexts = channelMessages.map(msg => msg.text).sort();
    expect(messageTexts).toEqual([
      `📊 Snapshot proposal "Finished Snapshot Proposal snap-fin-slack-1" has ended on DAO ${testDaoId}`,
      `📊 Snapshot proposal "Finished Snapshot Proposal snap-fin-slack-2" has ended on DAO ${testDaoId}`,
      `📊 Snapshot proposal "Finished Snapshot Proposal snap-fin-slack-3" has ended on DAO ${testDaoId}`,
    ]);

    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 3);
  });

  test('should NOT notify channels not subscribed to the DAO', async () => {
    const channelId = 'C_OFF_NOSUB_01';

    const subscriptionTime = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      'different-dao',
      true,
      subscriptionTime,
      'slack'
    );

    const proposal = createFinishedOffchainProposal(testDaoId, 'snap-nosub-slack-1');

    server.use(offchainProposalsHandler({ items: [proposal], totalCount: 1 }));

    const messagePromise = slackHelper.waitForMessage(
      msg => msg.text.includes('Snapshot proposal') && msg.text.includes('has ended') && msg.channel === channelId,
      { timeout: timeouts.wait.short },
    );

    await expect(messagePromise).rejects.toThrow();
  });
});
