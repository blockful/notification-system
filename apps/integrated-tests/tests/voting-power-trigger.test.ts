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
import { TelegramTestHelper } from '../src/helpers/telegram-test-helper';
import { DatabaseTestHelper } from '../src/helpers/database-test-helper';

describe('Voting Power Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let testDaoId: string;
  let testUserWithSubscription: string;
  let testUserWithoutSubscription: string;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

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
    
    // Initialize test helpers
    telegramHelper = new TelegramTestHelper(mockSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  }, 60000);

  beforeEach(async () => {
    jest.clearAllMocks();
    httpMockSetup.reset();
    apps.rabbitmqSetup.clearCollectedEvents();
    
    // Clear notifications table between tests
    await db('notifications').delete();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
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

    // Wait for the voting power notification to be sent
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('voting power') && msg.text.includes(testDaoId),
      { timeout: 3000 }
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