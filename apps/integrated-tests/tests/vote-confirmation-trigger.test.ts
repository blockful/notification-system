import { describe, test, expect, beforeEach, jest, beforeAll, afterEach } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, VoteFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Vote Confirmation Trigger - Integration Test', () => {
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

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send vote confirmation notification when user votes FOR', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;
    
    // Create user with subscription to DAO
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-for',
      testDaoId,
      true,
      pastTimestamp
    );
    
    // Create address mapping
    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);
    
    // Create vote event with timestamp in the future to ensure processing
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    
    const voteEvents = [
      {
        daoId: testDaoId,
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        proposalId: 'prop-for-123',
        voterAccountId: voterAddress,
        support: '1', // FOR
        votingPower: '1000000000000000000000', // 1000 tokens
        timestamp: eventTimestamp,
        reason: 'Great proposal!'
      }
    ];
    
    // Setup GraphQL mock
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [], // No proposals needed
      [], // No voting power events
      { [testDaoId]: 1 }, // Map daoId to chainId
      voteEvents // Add votes to mock
    );
    
    // Wait for notification
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.notification.delivery }
    );
    
    // Verify message content for FOR vote
    expect(message.text).toContain('✅'); // FOR emoji
    expect(message.text).toContain('voted FOR');
    expect(message.text).toContain('[Transaction details](https://etherscan.io/tx/');
    expect(message.text).not.toContain('{{txLink}}');
    expect(message.chatId).toBe(testUser.chatId);
  });

  test('should send vote confirmation notification when user votes AGAINST', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p2;
    const voterAddress = testUser.address;
    
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-against',
      testDaoId,
      true,
      pastTimestamp
    );
    
    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);
    
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    
    const voteEvents = [
      {
        daoId: testDaoId,
        txHash: '0x2345678901bcdef2345678901bcdef2345678901bcdef2345678901bcdef2345',
        proposalId: 'prop-against-456',
        voterAccountId: voterAddress,
        support: '0', // AGAINST
        votingPower: '5000000000000000000000', // 5000 tokens
        timestamp: eventTimestamp,
        reason: 'Needs more discussion'
      }
    ];
    
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );
    
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.notification.delivery }
    );
    
    // Verify message content for AGAINST vote
    expect(message.text).toContain('❌'); // AGAINST emoji
    expect(message.text).toMatch(/AGAINST|Your vote just went through/i);
    expect(message.text).toContain('[Transaction details](https://etherscan.io/tx/');
    expect(message.chatId).toBe(testUser.chatId);
  });

  test('should send vote confirmation notification when user ABSTAINS', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p3;
    const voterAddress = testUser.address;
    
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-abstain',
      testDaoId,
      true,
      pastTimestamp
    );
    
    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);
    
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    
    const voteEvents = [
      {
        daoId: testDaoId,
        txHash: '0x3456789012cdef3456789012cdef3456789012cdef3456789012cdef34567890',
        proposalId: 'prop-abstain-789',
        voterAccountId: voterAddress,
        support: '2', // ABSTAIN
        votingPower: '2000000000000000000000', // 2000 tokens
        timestamp: eventTimestamp
        // No reason provided for abstain
      }
    ];
    
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );
    
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.notification.delivery }
    );
    
    // Verify message content for ABSTAIN vote
    expect(message.text).toContain('⚪'); // ABSTAIN emoji
    expect(message.text).toMatch(/ABSTAIN|Your vote just went through/i);
    expect(message.text).toContain('[Transaction details](https://etherscan.io/tx/');
    expect(message.chatId).toBe(testUser.chatId);
  });

  test('should NOT send duplicate notifications for same vote (txHash)', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;
    
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-duplicate',
      testDaoId,
      true,
      pastTimestamp
    );
    
    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);
    
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    const sameTxHash = '0x4567890123def4567890123def4567890123def4567890123def4567890123def';
    
    // Same vote event will be processed twice (simulating duplicate trigger)
    const voteEvents = [
      {
        daoId: testDaoId,
        txHash: sameTxHash,
        proposalId: 'prop-dup-123',
        voterAccountId: voterAddress,
        support: '1',
        votingPower: '1000000000000000000000',
        timestamp: eventTimestamp
      }
    ];
    
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );
    
    // Wait for first notification
    const firstMessage = await telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.notification.delivery }
    );
    
    expect(firstMessage).toBeDefined();
    
    // Reset triggers to force re-processing
    apps.logicSystemApp.resetTriggers();
    
    // Wait and verify no second notification is sent
    const startTime = Date.now();
    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.wait.short }
    );
    
    await expect(messagePromise).rejects.toThrow('Telegram message not received');
    
    // Verify we waited for the timeout
    expect(Date.now() - startTime).toBeGreaterThanOrEqual(timeouts.wait.short - 100);
  });

  test('should handle multiple votes from same user', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;
    
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    const { user: userWithSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-multiple',
      testDaoId,
      true,
      pastTimestamp
    );
    
    await UserFactory.createUserAddress(userWithSub.id, voterAddress, pastTimestamp);
    
    const baseTimestamp = Math.floor(Date.now() / 1000) + 10;
    
    // Create multiple vote events
    const voteEvents = [
      {
        daoId: testDaoId,
        txHash: '0x5678901234ef5678901234ef5678901234ef5678901234ef5678901234ef5678',
        proposalId: 'prop-multi-1',
        voterAccountId: voterAddress,
        support: '1', // FOR
        votingPower: '1000000000000000000000',
        timestamp: baseTimestamp.toString()
      },
      {
        daoId: testDaoId,
        txHash: '0x6789012345f6789012345f6789012345f6789012345f6789012345f6789012345',
        proposalId: 'prop-multi-2',
        voterAccountId: voterAddress,
        support: '0', // AGAINST
        votingPower: '1000000000000000000000',
        timestamp: (baseTimestamp + 1).toString()
      },
      {
        daoId: testDaoId,
        txHash: '0x78901234567890123456789012345678901234567890123456789012345678ab',
        proposalId: 'prop-multi-3',
        voterAccountId: voterAddress,
        support: '2', // ABSTAIN
        votingPower: '1000000000000000000000',
        timestamp: (baseTimestamp + 2).toString()
      }
    ];
    
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );
    
    // Wait for all three notifications
    const messages = await Promise.all([
      telegramHelper.waitForMessage(
        msg => msg.text.includes('✅'),
        { timeout: timeouts.notification.delivery }
      ),
      telegramHelper.waitForMessage(
        msg => msg.text.includes('❌'),
        { timeout: timeouts.notification.delivery }
      ),
      telegramHelper.waitForMessage(
        msg => msg.text.includes('⚪'),
        { timeout: timeouts.notification.delivery }
      )
    ]);
    
    // Verify all messages were received
    expect(messages).toHaveLength(3);
    expect(messages.every(m => m.chatId === testUser.chatId)).toBe(true);
  });

  test('should NOT notify users not subscribed to DAO', async () => {
    const testDaoId = testConstants.daoIds.voteTest || 'test-dao-vote';
    const testUser = testConstants.profiles.p1;
    const voterAddress = testUser.address;
    
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();
    
    // Create user WITHOUT subscription to the DAO
    const { user: userWithoutSub } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'vote-user-no-sub',
      'different-dao', // Subscribed to different DAO
      true,
      pastTimestamp
    );
    
    await UserFactory.createUserAddress(userWithoutSub.id, voterAddress, pastTimestamp);
    
    const eventTimestamp = (Math.floor(Date.now() / 1000) + 10).toString();
    
    const voteEvents = [
      {
        daoId: testDaoId, // Vote is in testDaoId
        txHash: '0x890123456789012345678901234567890123456789012345678901234567890cd',
        proposalId: 'prop-nosub',
        voterAccountId: voterAddress,
        support: '1',
        votingPower: '1000000000000000000000',
        timestamp: eventTimestamp
      }
    ];
    
    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      { [testDaoId]: 1 },
      voteEvents
    );
    
    // Verify no notification is sent
    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('just voted on'),
      { timeout: timeouts.wait.short }
    );
    
    await expect(messagePromise).rejects.toThrow('Telegram message not received');
  });
});