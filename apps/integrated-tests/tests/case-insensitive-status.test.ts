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

describe('Case Insensitive Status Filtering - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let testDaoId: string;
  let testUserId: string;
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
    
    // Create DAO
    testDaoId = 'TEST_DAO';
    
    // Create User with subscription
    const testUser = await UserFactory.createUserWithFullSetup('555555555', 'test_user', testDaoId, true, now);
    testUserId = testUser.user.id;
  }

  test('should handle multiple proposals with different case statuses simultaneously', async () => {
    // Setup multiple proposals with different case statuses
    const proposals = [
      ProposalFactory.createProposal(testDaoId, 'multi-pending-1', { status: 'pending' }),
      ProposalFactory.createProposal(testDaoId, 'multi-pending-2', { status: 'Pending' }),
      ProposalFactory.createProposal(testDaoId, 'multi-pending-3', { status: 'PENDING' }),
      ProposalFactory.createProposal(testDaoId, 'multi-weird-1', { status: 'penDIng' }),  
      ProposalFactory.createProposal(testDaoId, 'multi-weird-2', { status: 'PeNdInG' }) 
    ];
    
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for 3 messages (only pending proposals should be notified)
    await telegramHelper.waitForMessageCount(3, { timeout: 3000 });
    
    // Verify all messages are for the test user
    const messages = telegramHelper.getAllMessages();
    expect(messages).toHaveLength(3);
    expect(messages.every(msg => msg.chatId === '555555555')).toBe(true);
    
    // Verify notifications were recorded
    await dbHelper.waitForRecordCount('notifications', 3);
  });
});