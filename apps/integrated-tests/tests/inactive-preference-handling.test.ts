import { describe, test, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import * as fs from 'fs';

// Setup Telegram mock only
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

describe('Inactive Preference Handling - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let uniDaoId: string;
  let ensDaoId: string;
  let activeUserId: string;
  let inactiveUserId: string;
  let userWithInactivePreferenceId: string;
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
  });

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

  async function createTestData() {
    const now = new Date().toISOString();
    
    // Create DAOs
    uniDaoId = 'UNISWAP';
    ensDaoId = 'ENS';
    
    // Create user that follows UNI with active preference
    const activeUser = await UserFactory.createUserWithFullSetup('111111111', 'active_user', uniDaoId, true, now);
    activeUserId = activeUser.user.id;
    
    // Create user that follows UNI but with INACTIVE preference
    const userWithInactiveUniPreference = await UserFactory.createUserWithFullSetup('555555555', 'inactive_pref_user', uniDaoId, false, now);
    inactiveUserId = userWithInactiveUniPreference.user.id;
    
    // Create user with inactive preference for ENS
    const userWithInactivePreference = await UserFactory.createUserWithFullSetup('666666666', 'user_inactive_pref', ensDaoId, false, now);
    userWithInactivePreferenceId = userWithInactivePreference.user.id;
  }

  test('should respect inactive preference states', async () => {
    // Setup proposals for both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos(['UNISWAP', 'ENS'], 'inactive-test');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for exactly 1 message (only active user should be notified)
    await telegramHelper.waitForMessageCount(1, { timeout: 3000 });
    
    // Verify the message was sent to the correct user
    const message = telegramHelper.getAllMessages()[0];
    expect(message.chatId).toBe('111111111'); // User with active UNI preference
    
    // Ensure no more messages are sent to inactive users
    await telegramHelper.waitForNoMessages(2000);
    
    // Verify total message count is still 1
    const allMessages = telegramHelper.getAllMessages();
    expect(allMessages).toHaveLength(1);
    
    // Verify users with inactive preferences were NOT notified
    const notifiedUsers = allMessages.map(msg => msg.chatId.toString());
    expect(notifiedUsers).not.toContain('555555555'); // User with inactive UNI preference
    expect(notifiedUsers).not.toContain('666666666'); // User with inactive ENS preference
    
    // Verify notification was only recorded for active user
    await dbHelper.waitForRecordCount('notifications', 1);
    const notification = await db('notifications').first();
    expect(notification.user_id).toBe(activeUserId);
  });

});