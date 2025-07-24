import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, VotingPowerFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Voting Power Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send voting power change notification to subscribed users', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    const testUserWithSubscription = 'user-with-subscription.eth';
    
    // Create users in database with a timestamp from the past to ensure temporal filtering works
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString(); // 10 seconds ago
    
    const userWithSub = await UserFactory.createUser(testUserWithSubscription, 'voting-power-user');

    // Create user preference (subscription equivalent) for voting power changes with past timestamp
    await UserFactory.createUserPreference(userWithSub.id, testDaoId, true, pastTimestamp);
    
    // Create user address mapping to link user to wallet address
    await UserFactory.createUserAddress(userWithSub.id, testUserWithSubscription, pastTimestamp);
    
    // Create voting power data with a timestamp that's after the user subscription
    // Add some buffer time to ensure the event happens after the user subscription
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 2).toString(); // 2 seconds in the future
    
    const votingPowerEvents = [
      VotingPowerFactory.createDelegationEvent(
        'delegator1.eth',
        testUserWithSubscription,
        testConstants.votingPower.default,
        testDaoId,
        { timestamp: eventTimestamp }
      )
    ];

    // Setup GraphQL mock to return voting power data (includes DAOs)
    GraphQLMockSetup.setupCombinedMock(
      httpMockSetup.getMockClient(),
      [], // No proposals needed
      votingPowerEvents
    );

    // Wait for the voting power notification to be sent
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('voting power') && msg.text.includes(testDaoId),
      { timeout: timeouts.notification.delivery }
    );

    // Verify the message contains the expected content
    expect(message.text).toContain('voting power');
    expect(message.text).toContain(testDaoId);
    
    // Verify the message was sent to a user (we got a telegram message)
    expect(message.chatId).toBeDefined();
    
    console.log('Voting power notification sent successfully:', {
      chatId: message.chatId,
      text: message.text.substring(0, 100) + '...'
    });
  });

  test('should create voting power events with different types', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    
    // Test delegation event
    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      'delegator.eth',
      'recipient.eth',
      testConstants.votingPower.small + '00',
      testDaoId
    );

    // Test transfer event
    const transferEvent = VotingPowerFactory.createTransferEvent(
      'sender.eth',
      'recipient.eth',
      testConstants.votingPower.default + '00',
      testDaoId
    );

    expect(delegationEvent.changeType).toBe('delegation');
    expect(delegationEvent.delegation?.delegatedValue).toBe(testConstants.votingPower.small + '00');
    expect(delegationEvent.transfer).toBeNull();

    expect(transferEvent.changeType).toBe('transfer');
    expect(transferEvent.transfer?.amount).toBe(testConstants.votingPower.default + '00');
    expect(transferEvent.delegation).toBeNull();
  });

  test('should create multiple voting power events', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    
    const multipleEvents = VotingPowerFactory.createMultipleVotingPowerEvents(3, 'user', testDaoId);

    expect(multipleEvents).toHaveLength(3);
    expect(multipleEvents[0].accountId).toBe('user1.eth');
    expect(multipleEvents[1].accountId).toBe('user2.eth');
    expect(multipleEvents[2].accountId).toBe('user3.eth');

    // Verify timestamps are sequential
    const timestamps = multipleEvents.map(e => parseInt(e.timestamp));
    expect(timestamps[1]).toBeGreaterThan(timestamps[0]);
    expect(timestamps[2]).toBeGreaterThan(timestamps[1]);
  });

  test('should create voting power events for multiple DAOs', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    
    const multiDaoEvents = VotingPowerFactory.createVotingPowerEventsForMultipleDaos(
      [testDaoId, 'second-dao'],
      'user.eth'
    );

    expect(multiDaoEvents).toHaveLength(2);
    expect(multiDaoEvents[0].daoId).toBe(testDaoId);
    expect(multiDaoEvents[1].daoId).toBe('second-dao');
    expect(multiDaoEvents[0].accountId).toBe('user.eth');
    expect(multiDaoEvents[1].accountId).toBe('user.eth');
  });
});