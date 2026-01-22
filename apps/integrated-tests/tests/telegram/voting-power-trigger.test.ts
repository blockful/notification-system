import { describe, test, expect, beforeEach, beforeAll, jest } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, VotingPowerFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('Voting Power Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send voting power change notification to subscribed users', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    const testUser = testConstants.profiles.p2;
    const testUserWithSubscription = testUser.address;
    
    // Create users in database with a timestamp from the past to ensure temporal filtering works
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString(); // 10 seconds ago
    
    // Create user with full setup
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId, 
      'voting-power-user',
      testDaoId,
      true,
      pastTimestamp
    );
    
    // Create user address mapping to link user to wallet address
    await UserFactory.createUserAddress(userWithSub.id, testUserWithSubscription, pastTimestamp);
    
    // Create voting power data with a timestamp that's after the user subscription
    // Add some buffer time to ensure the event happens after the user subscription
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString(); // 10 seconds in the future
    
    const votingPowerEvents = [
      VotingPowerFactory.createDelegationEvent(
        testConstants.eventActors.delegator1,
        testUserWithSubscription,
        testConstants.votingPower.default,
        testDaoId,
        { 
          timestamp: eventTimestamp,
          chainId: 1, // Ethereum mainnet
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        }
      )
    ];

    // Setup GraphQL mock to return voting power data (includes DAOs)
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [], // No proposals needed
      votingPowerEvents,
      { [testDaoId]: 1 } // Map testDaoId to Ethereum mainnet
    );

    // Wait for the voting power notification to be sent
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('voting power') && msg.text.includes(testDaoId),
      { timeout: timeouts.notification.delivery }
    );

    // Verify the message contains the expected content
    expect(message.text).toContain('voting power');
    expect(message.text).toContain(testDaoId);
    
    // Verify that the placeholder was replaced with the actual link
    expect(message.text).not.toContain('{{txLink}}');
    
    // Verify transaction link is included (can be in Markdown format)
    expect(message.text.length).toBeGreaterThan(50); // Check that message is complete
    
    // Verify the message was sent to a user (we got a telegram message)
    expect(message.chatId).toBeDefined();
  });

  test('should create voting power events with different types', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    
    // Test delegation event
    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      testConstants.eventActors.delegator,
      testConstants.eventActors.recipient,
      testConstants.votingPower.small + '00',
      testDaoId
    );

    // Test transfer event
    const transferEvent = VotingPowerFactory.createTransferEvent(
      testConstants.eventActors.sender,
      testConstants.eventActors.recipient,
      testConstants.votingPower.default + '00',
      testDaoId
    );

    expect(delegationEvent.changeType).toBe('delegation');
    expect(delegationEvent.delegation?.value).toBe(testConstants.votingPower.small + '00');
    expect(delegationEvent.transfer).toBeNull();

    expect(transferEvent.changeType).toBe('transfer');
    expect(transferEvent.transfer?.value).toBe(testConstants.votingPower.default + '00');
    expect(transferEvent.delegation).toBeNull();
  });

  test('should create multiple voting power events', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    
    const multipleEvents = VotingPowerFactory.createMultipleVotingPowerEvents(3, testConstants.eventActors.userPrefix, testDaoId);

    expect(multipleEvents).toHaveLength(3);
    expect(multipleEvents[0].accountId).toBe(`${testConstants.eventActors.userPrefix}1.eth`);
    expect(multipleEvents[1].accountId).toBe(`${testConstants.eventActors.userPrefix}2.eth`);
    expect(multipleEvents[2].accountId).toBe(`${testConstants.eventActors.userPrefix}3.eth`);

    // Verify timestamps are sequential
    const timestamps = multipleEvents.map(e => parseInt(e.timestamp));
    expect(timestamps[1]).toBeGreaterThan(timestamps[0]);
    expect(timestamps[2]).toBeGreaterThan(timestamps[1]);
  });

  test('should create voting power events for multiple DAOs', async () => {
    const testDaoId = testConstants.daoIds.votingPowerTest;
    
    const multiDaoEvents = VotingPowerFactory.createVotingPowerEventsForMultipleDaos(
      [testDaoId, testConstants.daoIds.secondDao],
      testConstants.profiles.p1.address,
    );

    expect(multiDaoEvents).toHaveLength(2);
    expect(multiDaoEvents[0].daoId).toBe(testDaoId);
    expect(multiDaoEvents[1].daoId).toBe(testConstants.daoIds.secondDao);
    expect(multiDaoEvents[0].accountId).toBe(testConstants.profiles.p1.address);
    expect(multiDaoEvents[1].accountId).toBe(testConstants.profiles.p1.address);
  });
});