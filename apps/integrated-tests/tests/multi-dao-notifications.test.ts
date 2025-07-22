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
import { ProposalFactory } from '../src/test-data/proposal-factory';
import { TelegramTestHelper } from '../src/helpers/telegram-test-helper';
import { DatabaseTestHelper } from '../src/helpers/database-test-helper';
import { RabbitMQTestHelper } from '../src/helpers/rabbitmq-test-helper';

describe('Multi-DAO Notification Flow - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let uniDaoId: string;
  let ensDaoId: string;
  let uniFollowerUserId: string;
  let ensFollowerUserId: string;
  let bothFollowerUserId: string;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;
  let rabbitHelper: RabbitMQTestHelper;

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
    rabbitHelper = new RabbitMQTestHelper(apps.rabbitmqSetup);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    httpMockSetup.reset();
    rabbitHelper.clearCollectedMessages();
    
    // Clear notifications table between tests
    await db('notifications').delete();
  });

  afterAll(async () => {
    if (apps) {
      await stopTestApps(apps);
    }
    closeDatabase();
  }, 40000);

  async function createTestData() {
    const now = new Date().toISOString();
    
    // Create DAOs
    uniDaoId = 'UNISWAP';
    ensDaoId = 'ENS';
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true, now);
    const ensFollower = await UserFactory.createUserWithFullSetup('222222222', 'ens_follower', ensDaoId, true, now);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true, now);
    
    uniFollowerUserId = uniFollower.user.id;
    ensFollowerUserId = ensFollower.user.id;
    bothFollowerUserId = bothFollower.user.id;
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollowerUserId, ensDaoId, true, now);
  }

  test('Both DAOs proposals should notify user following both DAOs twice', async () => {
    // Setup mock to return active proposals from both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos(['UNISWAP', 'ENS'], 'multi-proposal');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for all expected messages
    await telegramHelper.waitForMessageCount(4, { timeout: 3000 });
    
    // Get all messages after they arrive
    const allMessages = telegramHelper.getAllMessages();
    
    // Verify UNI follower received 1 message
    const uniFollowerMessages = allMessages.filter(msg => msg.chatId === '111111111');
    expect(uniFollowerMessages).toHaveLength(1);
    expect(uniFollowerMessages[0].text).toContain('UNISWAP');
    
    // Verify ENS follower received 1 message
    const ensFollowerMessages = allMessages.filter(msg => msg.chatId === '222222222');
    expect(ensFollowerMessages).toHaveLength(1);
    expect(ensFollowerMessages[0].text).toContain('ENS');
    
    // Verify both follower received 2 messages
    const bothFollowerMessages = allMessages.filter(msg => msg.chatId === '333333333');
    expect(bothFollowerMessages).toHaveLength(2);
    
    // Verify database records
    await dbHelper.waitForRecordCount('notifications', 4);
  });

  test('should handle multiple simultaneous proposals from same DAO', async () => {
    // Setup multiple UNI proposals simultaneously
    const multipleUniProposals = ProposalFactory.createMultipleProposals('UNISWAP', 3, 'uni-multi');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), multipleUniProposals);
    
    // Wait for all 6 messages (3 proposals × 2 UNI followers)
    await telegramHelper.waitForMessageCount(6, { timeout: 3000 });
    
    // Get all messages and verify distribution
    const allMessages = telegramHelper.getAllMessages();
    
    // Verify UNI follower received 3 messages
    const uniFollowerMessages = allMessages.filter(msg => msg.chatId === '111111111');
    expect(uniFollowerMessages).toHaveLength(3);
    
    // Verify both follower received 3 messages
    const bothFollowerMessages = allMessages.filter(msg => msg.chatId === '333333333');
    expect(bothFollowerMessages).toHaveLength(3);
    
    // Verify ENS follower did NOT receive any messages
    const ensFollowerMessages = allMessages.filter(msg => msg.chatId === '222222222');
    expect(ensFollowerMessages).toHaveLength(0);
    
    // Verify all notifications were sent
    await dbHelper.waitForRecordCount('notifications', 6);
    
    // Verify they are all for UNISWAP
    const notifications = await db('notifications').where({ dao_id: 'UNISWAP' });
    expect(notifications).toHaveLength(6);
  });
});