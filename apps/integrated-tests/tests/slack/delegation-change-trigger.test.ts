/**
 * Slack Delegation Change Notifications - Integration Test
 * Tests that delegation change notifications are correctly delivered via Slack
 * Supports both mock and real Slack delivery modes
 */

import { describe, test, expect, beforeAll, afterEach } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, VotingPowerFactory, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SlackTestClient } from '../../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../../src/config';
import { env } from '../../src/config/env';

describe('Slack Delegation Change Notifications - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  // Test configuration
  const testDaoId = testConstants.daoIds.votingPowerTest;

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


  test('should send delegation confirmation notification to delegator via Slack', async () => {

    const delegatorAddress = testConstants.profiles.p1.address;
    const delegateAddress = testConstants.profiles.p2.address;
    const channelId = 'C_DELEGATOR_01';

    // Create delegator user (who will receive delegation confirmation)
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    const pastTimestamp = new Date(Date.now() - 60000).toISOString();
    const { user: delegatorUser } = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      pastTimestamp,
      'slack'
    );
    await UserFactory.createUserAddress(delegatorUser.id, delegatorAddress, pastTimestamp);

    // Create delegation event where user delegates to someone else
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      delegatorAddress, // who delegates (source) - our test user
      delegateAddress,  // who receives delegation (target) - someone else
      testConstants.votingPower.default,
      testDaoId,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }
    );

    // Setup GraphQL mock to return voting power data
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [delegationEvent],
      { [testDaoId]: 1 }
    );

    // Wait for delegation confirmation notification
    const delegatorMessage = await slackHelper.waitForMessage(
      msg => msg.text.includes('✅ Delegation confirmed') &&
             msg.text.includes(testDaoId) &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack delegation confirmation not received',
        useHistory: env.SEND_REAL_SLACK === 'true',
        channel: channelId
      }
    );

    // Verify delegator confirmation notification
    expect(delegatorMessage.channel).toBe(channelId);
    expect(delegatorMessage.text).toContain('✅ Delegation confirmed');
    expect(delegatorMessage.text).toContain(testDaoId);
    expect(delegatorMessage.text).toContain('delegated');

    // Verify Slack formatting - links should be in <url|text> format
    if (delegatorMessage.text.includes('http')) {
      expect(delegatorMessage.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

    // Verify message has substantial content
    expect(delegatorMessage.text.length).toBeGreaterThan(50);

    // Verify database records
    const notifications = await dbHelper.getNotifications();
    const slackNotification = notifications.find(n =>
      n.user_id === delegatorUser.id
    );
    expect(slackNotification).toBeDefined();
    expect(slackNotification?.dao_id).toBe(testDaoId);
  });

  test('should send self-delegation confirmation with special message via Slack', async () => {

    const userAddress = testConstants.profiles.p1.address;
    const channelId = 'C_SELF_DEL_01';

    // Create user
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    const pastTimestamp = new Date(Date.now() - 60000).toISOString();
    const { user } = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      pastTimestamp,
      'slack'
    );
    await UserFactory.createUserAddress(user.id, userAddress, pastTimestamp);

    // Create self-delegation event
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const selfDelegationEvent = VotingPowerFactory.createDelegationEvent(
      userAddress, // same address for both source and target
      userAddress,
      testConstants.votingPower.default,
      testDaoId,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0x1111111111111111111111111111111111111111111111111111111111111111'
      }
    );

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [selfDelegationEvent],
      { [testDaoId]: 1 }
    );

    // Wait for the single self-delegation confirmation message
    const selfDelegationMessage = await slackHelper.waitForMessage(
      msg => msg.text.includes('🔄 Self-delegation confirmed') &&
             msg.text.includes(testDaoId) &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack self-delegation confirmation not received'
      }
    );

    // Verify self-delegation message content
    expect(selfDelegationMessage.channel).toBe(channelId);
    expect(selfDelegationMessage.text).toContain('🔄 Self-delegation confirmed');
    expect(selfDelegationMessage.text).toContain('You delegated');
    expect(selfDelegationMessage.text).toContain('to yourself');
    expect(selfDelegationMessage.text).toContain('Your total voting power is now');
  });

  test('should send undelegation confirmation notification via Slack', async () => {

    const delegatorAddress = testConstants.profiles.p1.address;
    const delegateAddress = testConstants.profiles.p2.address;
    const channelId = 'C_UNDELEG_01';

    // Create delegator user
    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId = `${workspaceId}:${channelId}`;
    const pastTimestamp = new Date(Date.now() - 60000).toISOString();
    const { user: delegatorUser } = await UserFactory.createUserWithFullSetup(
      slackUserId,
      `slack_user_${channelId}`,
      testDaoId,
      true,
      pastTimestamp,
      'slack'
    );
    await UserFactory.createUserAddress(delegatorUser.id, delegatorAddress, pastTimestamp);

    // Create undelegation event (negative delta)
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const undelegationEvent = VotingPowerFactory.createDelegationEvent(
      delegatorAddress,
      delegateAddress,
      '-' + testConstants.votingPower.default, // negative for undelegation
      testDaoId,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'
      }
    );

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [undelegationEvent],
      { [testDaoId]: 1 }
    );

    // Wait for undelegation confirmation notification
    const delegatorMessage = await slackHelper.waitForMessage(
      msg => msg.text.includes('↩️ Undelegation confirmed') &&
             msg.text.includes(testDaoId) &&
             msg.channel === channelId,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack undelegation confirmation not received'
      }
    );

    // Verify undelegation confirmation notification
    expect(delegatorMessage.channel).toBe(channelId);
    expect(delegatorMessage.text).toContain('↩️ Undelegation confirmed');
    expect(delegatorMessage.text).toContain('removed');

    // Verify database record
    const notifications = await dbHelper.getNotifications();
    const slackNotification = notifications.find(n =>
      n.user_id === delegatorUser.id
    );
    expect(slackNotification).toBeDefined();
    expect(slackNotification?.dao_id).toBe(testDaoId);
  });

  test('Multiple Slack users receive delegation notifications', async () => {

    const channel1 = 'C_MULTI_DEL_1';
    const channel2 = 'C_MULTI_DEL_2';
    const delegatorAddress = testConstants.profiles.p1.address;
    const delegateAddress = testConstants.profiles.p2.address;

    // Create two Slack users with same wallet address (both will receive notification)
    const pastTimestamp = new Date(Date.now() - 60000).toISOString();

    const workspaceId = WorkspaceFactory.getWorkspaceId();
    const slackUserId1 = `${workspaceId}:${channel1}`;
    const { user: user1 } = await UserFactory.createUserWithFullSetup(
      slackUserId1,
      `slack_user_${channel1}`,
      testDaoId,
      true,
      pastTimestamp,
      'slack'
    );
    await UserFactory.createUserAddress(user1.id, delegatorAddress, pastTimestamp);

    const slackUserId2 = `${workspaceId}:${channel2}`;
    const { user: user2 } = await UserFactory.createUserWithFullSetup(
      slackUserId2,
      `slack_user_${channel2}`,
      testDaoId,
      true,
      pastTimestamp,
      'slack'
    );
    await UserFactory.createUserAddress(user2.id, delegatorAddress, pastTimestamp);

    // Create delegation event
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      delegatorAddress,
      delegateAddress,
      testConstants.votingPower.default,
      testDaoId,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0xaabbccddeeff112233445566778899001122334455667788990011223344556'
      }
    );

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [delegationEvent],
      { [testDaoId]: 1 }
    );

    // Wait for both notifications
    const messages = await slackHelper.waitForMessageCount(
      2,
      {
        timeout: timeouts.notification.delivery,
        containing: '✅ Delegation confirmed'
      }
    );

    // Verify both channels received messages
    const channels = messages.map(m => m.channel);
    expect(channels).toContain(channel1);
    expect(channels).toContain(channel2);

    // Verify content is identical for both
    messages.forEach(message => {
      expect(message.text).toContain('✅ Delegation confirmed');
      expect(message.text).toContain(testDaoId);
      expect(message.text).toContain('delegated');
    });
  });
});