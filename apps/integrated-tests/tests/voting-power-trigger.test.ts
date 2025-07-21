import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';
import { setupTelegramMock } from '../src/mocks/telegram-mock-setup';
const mockSendMessage = setupTelegramMock();
import { db, closeDatabase } from '../src/setup/database-config';
import { setupDatabase } from '../src/setup/database';
import { startTestApps, stopTestApps, TestApps } from '../src/setup/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
import { UserFactory } from '../src/test-data/user-factory';
import { VotingPowerFactory } from '../src/test-data/voting-power-factory';

describe('Voting Power Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let testDaoId: string;
  let testUserWithSubscription: string;
  let testUserWithoutSubscription: string;

  beforeAll(async () => {
    // Clean up any existing test databases
    const files = fs.readdirSync('/tmp').filter(f => f.startsWith('test_integration_'));
    files.forEach(file => {
      fs.unlinkSync(`/tmp/${file}`);
    });

    await setupDatabase();
    await createTestData();
    
    // Setup mocks
    httpMockSetup = new HttpClientMockSetup();

    // Start all applications
    apps = await startTestApps(db, httpMockSetup.getMockClient());
  }, 60000);

  beforeEach(async () => {
    jest.clearAllMocks();
    httpMockSetup.reset();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
    // Give some time for cleanup
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 40000);

  const createTestData = async () => {
    testDaoId = 'test-dao-voting-power';
    testUserWithSubscription = 'user-with-subscription.eth';
    testUserWithoutSubscription = 'user-without-subscription.eth';

    // Create users in database with a timestamp from the past to ensure temporal filtering works
    const pastTimestamp = new Date(Date.now() - 10000).toISOString(); // 10 seconds ago
    
    const userWithSub = await UserFactory.createUser(testUserWithSubscription, 'voting-power-user');
    const userWithoutSub = await UserFactory.createUser(testUserWithoutSubscription, 'voting-power-user-2');

    // Create user preference (subscription equivalent) for voting power changes with past timestamp
    const preference = await UserFactory.createUserPreference(userWithSub.id, testDaoId, true, pastTimestamp);
    
    // Create user address mapping to link user to wallet address
    await UserFactory.createUserAddress(userWithSub.id, testUserWithSubscription, pastTimestamp);
  };

  test('should send voting power change notification to subscribed users', async () => {
    // Create voting power data with a timestamp that's after the user subscription
    // Add some buffer time to ensure the event happens after the user subscription
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 2).toString(); // 2 seconds in the future
    
    const votingPowerEvents = [
      VotingPowerFactory.createDelegationEvent(
        'delegator1.eth',
        testUserWithSubscription,
        '1000',
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

    // Wait for trigger to execute (triggers run every 3 seconds in test mode)
    await new Promise(resolve => setTimeout(resolve, 4500));

    // Verify that notification was sent to subscribed user
    expect(mockSendMessage).toHaveBeenCalled();

    // Get the last message sent
    const lastCall = mockSendMessage.mock.calls[mockSendMessage.mock.calls.length - 1];
    const sentMessage = lastCall[1];
    
    // Verify notification content contains voting power information
    expect(sentMessage).toContain('voting power');
    expect(sentMessage).toContain(testDaoId);
  });

  test('should create voting power events with different types', async () => {
    // Test delegation event
    const delegationEvent = VotingPowerFactory.createDelegationEvent(
      'delegator.eth',
      'recipient.eth',
      '2000',
      testDaoId
    );

    // Test transfer event
    const transferEvent = VotingPowerFactory.createTransferEvent(
      'sender.eth',
      'recipient.eth',
      '3000',
      testDaoId
    );

    expect(delegationEvent.changeType).toBe('delegation');
    expect(delegationEvent.delegation?.delegatedValue).toBe('2000');
    expect(delegationEvent.transfer).toBeNull();

    expect(transferEvent.changeType).toBe('transfer');
    expect(transferEvent.transfer?.amount).toBe('3000');
    expect(transferEvent.delegation).toBeNull();
  });

  test('should create multiple voting power events', async () => {
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