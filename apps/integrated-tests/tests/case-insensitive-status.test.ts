import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Status Case Variations - Integration Test', () => {
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

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should handle supported case variations (lowercase, UPPERCASE, Title) and ignore unsupported mixed cases', async () => {
    // Create DAO for this test
    const testDaoId = 'TEST_DAO';
    
    // Create User with subscription
    await UserFactory.createUserWithFullSetup(testConstants.testUsers.user4, 'test_user', testDaoId, true);
    
    // Setup multiple proposals with different case statuses
    const proposals = [
      ProposalFactory.createProposal(testDaoId, 'multi-pending-1', { status: 'pending' }),
      ProposalFactory.createProposal(testDaoId, 'multi-pending-2', { status: 'Pending' }),
      ProposalFactory.createProposal(testDaoId, 'multi-pending-3', { status: 'PENDING' }),
      ProposalFactory.createProposal(testDaoId, 'multi-weird-1', { status: 'penDIng' }),  
      ProposalFactory.createProposal(testDaoId, 'multi-weird-2', { status: 'PeNdInG' }) 
    ];
    
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for 3 messages (only supported case variations: pending, Pending, PENDING)
    await telegramHelper.waitForMessageCount(3, { timeout: timeouts.notification.delivery });
    
    // Verify all messages are for the test user
    const messages = telegramHelper.getAllMessages();
    expect(messages).toHaveLength(3);
    expect(messages.every(msg => msg.chatId === testConstants.testUsers.user4)).toBe(true);
    
    // Verify notifications were recorded
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 3);
  });
});