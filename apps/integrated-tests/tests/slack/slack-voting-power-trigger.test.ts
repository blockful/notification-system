/**
 * Slack Voting Power Trigger Integration Test
 * Tests that voting power change notifications are correctly delivered via Slack
 * Verifies delegation, transfer, and other voting power events
 */

import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, VotingPowerFactory, WorkspaceFactory } from '../../src/fixtures';
import { SlackTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { SlackTestClient } from '../../src/test-clients/slack-test.client';
import { testConstants, timeouts } from '../../src/config';
import { env } from '../../src/config/env';

describe('Slack Voting Power Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let slackHelper: SlackTestHelper;
  let slackClient: SlackTestClient;
  let dbHelper: DatabaseTestHelper;

  // Test configuration
  const SLACK_CHANNEL_ID = env.SLACK_TEST_CHANNEL_ID || 'C1234567890';
  const TEST_DAO_ID = testConstants.daoIds.votingPowerTest;

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

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();

    // Create default Slack workspace for OAuth support
  });


  test('Basic voting power change notification delivered to Slack', async () => {
    const userWalletAddress = testConstants.profiles.p1.address;

    // Create Slack user with wallet address
    const user = await createSlackUserWithWallet(
      SLACK_CHANNEL_ID,
      TEST_DAO_ID,
      userWalletAddress
    );

    // Create voting power event with future timestamp
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();

    const votingPowerEvents = [
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator1,
        userWalletAddress,
        testConstants.votingPower.default,
        TEST_DAO_ID,
        {
          timestamp: eventTimestamp,
          chainId: 1, // Ethereum mainnet
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        }
      )
    ];

    // Setup GraphQL mock to return voting power data
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [], // No proposals needed
      votingPowerEvents,
      { [TEST_DAO_ID]: 1 } // Map testDaoId to Ethereum mainnet
    );

    // Wait for the voting power notification to be sent
    const message = await slackHelper.waitForMessage(
      msg => {
        return msg.text.includes('voting power') &&
               msg.text.includes(TEST_DAO_ID) &&
               msg.channel === SLACK_CHANNEL_ID;
      },
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack voting power notification not received'
      }
    );

    // Verify message was sent to correct channel
    expect(message.channel).toBe(SLACK_CHANNEL_ID);

    // Verify the message contains expected content
    expect(message.text).toContain('voting power');
    expect(message.text).toContain(TEST_DAO_ID);

    // Verify Slack-specific formatting (links should be in Slack format)
    if (message.text.includes('http')) {
      // Transaction links should be in Slack format <url|text>
      expect(message.text).toMatch(/<https?:\/\/[^|]+\|[^>]+>/);
    }

    // Verify database records
    const notifications = await dbHelper.getNotifications();
    const vpNotification = notifications.find(n =>
      n.user_id === user.id &&
      n.event_id === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' &&
      n.dao_id === TEST_DAO_ID
    );
    expect(vpNotification).toBeDefined();
  });

  test('Delegation received notification for Slack user', async () => {
    const receiverAddress = testConstants.profiles.p2.address;
    const delegatorAddress = testConstants.eventActors.delegator1;

    // Create Slack user who will receive delegation
    const receiver = await createSlackUserWithWallet(
      SLACK_CHANNEL_ID,
      TEST_DAO_ID,
      receiverAddress
    );

    // Create delegation event
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();

    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      delegatorAddress,
      receiverAddress,
      testConstants.votingPower.default,
      TEST_DAO_ID,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0xabc123def456abc123def456abc123def456abc123def456abc123def456abc1',
        delta: testConstants.votingPower.default
      }
    );

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [delegationEvent],
      { [TEST_DAO_ID]: 1 }
    );

    // Wait for delegation notification
    const message = await slackHelper.waitForMessage(
      msg => {
        return msg.text.includes('delegated') &&
               msg.text.includes('voting power') &&
               msg.channel === SLACK_CHANNEL_ID;
      },
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack delegation notification not received'
      }
    );

    // Verify delegation-specific content
    expect(message.text).toContain('delegated');
    expect(message.text).toContain('voting power');

    // Should mention the delegator address
    const delegatorShort = `${delegatorAddress.slice(0, 6)}...${delegatorAddress.slice(-4)}`;
    expect(message.text.toLowerCase()).toMatch(new RegExp(delegatorShort.toLowerCase()));
  });

  test('Transfer event notification for Slack user', async () => {
    const receiverAddress = testConstants.profiles.p3.address;
    const senderAddress = testConstants.eventActors.sender;

    // Create Slack user who will receive transfer
    const receiver = await createSlackUserWithWallet(
      SLACK_CHANNEL_ID,
      TEST_DAO_ID,
      receiverAddress
    );

    // Create transfer event
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();

    const transferEvent = VotingPowerFactory.createTransferEvent(
      senderAddress,
      receiverAddress,
      testConstants.votingPower.medium,
      TEST_DAO_ID,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: '0xdef456abc123def456abc123def456abc123def456abc123def456abc123def4'
      }
    );

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [transferEvent],
      { [TEST_DAO_ID]: 1 }
    );

    // Wait for transfer notification
    const message = await slackHelper.waitForMessage(
      msg => {
        return msg.text.includes('voting power') &&
               msg.text.includes(TEST_DAO_ID) &&
               msg.channel === SLACK_CHANNEL_ID;
      },
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack transfer notification not received'
      }
    );

    // Verify it's a voting power change notification
    expect(message.text).toContain('voting power');
    expect(message.channel).toBe(SLACK_CHANNEL_ID);
  });

  test('Multiple voting power events processed correctly', async () => {
    const userAddress = testConstants.profiles.p1.address;

    // Create Slack user
    const user = await createSlackUserWithWallet(
      SLACK_CHANNEL_ID,
      TEST_DAO_ID,
      userAddress
    );

    // Create multiple voting power events
    const baseTimestamp = Math.floor(Date.now() / 1000) + 10;
    const events = [
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator1,
        userAddress,
        testConstants.votingPower.small,
        TEST_DAO_ID,
        {
          timestamp: baseTimestamp.toString(),
          chainId: 1,
          transactionHash: '0x111'
        }
      ),
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator2,
        userAddress,
        testConstants.votingPower.medium,
        TEST_DAO_ID,
        {
          timestamp: (baseTimestamp + 1).toString(),
          chainId: 1,
          transactionHash: '0x222'
        }
      ),
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator3,
        userAddress,
        testConstants.votingPower.default,
        TEST_DAO_ID,
        {
          timestamp: (baseTimestamp + 2).toString(),
          chainId: 1,
          transactionHash: '0x333'
        }
      )
    ];

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      events,
      { [TEST_DAO_ID]: 1 }
    );

    // Wait for multiple messages
    const messages = await slackHelper.waitForMessageCount(
      3,
      msg => msg.text.includes('voting power') && msg.channel === SLACK_CHANNEL_ID,
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Not all Slack voting power notifications received'
      }
    );

    // Verify all 3 messages were received
    expect(messages).toHaveLength(3);

    // All should be to the correct channel
    messages.forEach(msg => {
      expect(msg.channel).toBe(SLACK_CHANNEL_ID);
      expect(msg.text).toContain('voting power');
    });
  });

  test('DAO isolation - only subscribed DAO users get notifications', async () => {
    const DAO1 = testConstants.daoIds.votingPowerTest;
    const DAO2 = testConstants.daoIds.secondDao;
    const userAddress = testConstants.profiles.p1.address;

    // Create user subscribed only to DAO1
    const dao1User = await createSlackUserWithWallet(
      SLACK_CHANNEL_ID,
      DAO1,
      userAddress
    );

    // Create events for both DAOs
    const timestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const events = [
      // Event for DAO1 - should trigger notification
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator1,
        userAddress,
        testConstants.votingPower.default,
        DAO1,
        { timestamp, chainId: 1, transactionHash: '0xdao1' }
      ),
      // Event for DAO2 - should NOT trigger notification
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator2,
        userAddress,
        testConstants.votingPower.default,
        DAO2,
        { timestamp, chainId: 1, transactionHash: '0xdao2' }
      )
    ];

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      events,
      { [DAO1]: 1, [DAO2]: 1 }
    );

    // Wait for notification (should only receive one)
    const message = await slackHelper.waitForMessage(
      msg => {
        return msg.text.includes('voting power') &&
               msg.text.includes(DAO1) &&
               msg.channel === SLACK_CHANNEL_ID;
      },
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack DAO1 voting power notification not received'
      }
    );

    // Verify correct DAO notification was received
    expect(message.text).toContain(DAO1);
    expect(message.text).not.toContain(DAO2);

    // Wait a bit more to ensure no DAO2 notification arrives
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify only DAO1 notifications were sent
    const allMessages = slackHelper.getAllMessages();
    const votingPowerMessages = allMessages.filter(msg =>
      msg.text.includes('voting power')
    );

    // All notifications should be for DAO1, none for DAO2
    votingPowerMessages.forEach(msg => {
      expect(msg.text).toContain(DAO1);
      expect(msg.text).not.toContain(DAO2);
    });
  });

  test('Slack markdown formatting for voting power messages', async () => {
    const userAddress = testConstants.profiles.p1.address;

    // Create Slack user
    const user = await createSlackUserWithWallet(
      SLACK_CHANNEL_ID,
      TEST_DAO_ID,
      userAddress
    );

    // Create voting power event with specific values to test formatting
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

    const event = VotingPowerFactory.createDelegationEvent(
      testConstants.eventActors.delegator1,
      userAddress,
      '1000000000000000000000', // Large number to test formatting
      TEST_DAO_ID,
      {
        timestamp: eventTimestamp,
        chainId: 1,
        transactionHash: txHash
      }
    );

    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [event],
      { [TEST_DAO_ID]: 1 }
    );

    // Wait for formatted message
    const message = await slackHelper.waitForMessage(
      msg => {
        return msg.text.includes('voting power') &&
               msg.channel === SLACK_CHANNEL_ID;
      },
      {
        timeout: timeouts.notification.delivery,
        errorMessage: 'Slack formatted voting power notification not received'
      }
    );

    // Verify Slack-specific formatting

    // Bold text should use single asterisks in Slack (not double)
    expect(message.text).not.toMatch(/\*\*[^*]+\*\*/); // No Telegram-style bold

    // Links should be in Slack format <url|text>
    if (message.text.includes('etherscan.io')) {
      expect(message.text).toMatch(/<https:\/\/etherscan\.io[^|]+\|[^>]+>/);
    }

    // Large numbers should be formatted nicely (e.g., "1,000.00")
    expect(message.text).toMatch(/[\d,]+\.?\d*/);

    // Should include the DAO name
    expect(message.text).toContain(TEST_DAO_ID);
  });
});