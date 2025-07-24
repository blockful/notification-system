import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Inactive Preference Handling - Integration Test', () => {
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

  test('should respect inactive preference states', async () => {
    // Create DAOs
    const uniDaoId = testConstants.daoIds.uniswap;
    const ensDaoId = testConstants.daoIds.ens;
    
    // Create user that follows UNI with active preference
    const activeUser = await UserFactory.createUserWithFullSetup(testConstants.testUsers.user1, 'active_user', uniDaoId, true);
    
    // Create user that follows UNI but with INACTIVE preference
    await UserFactory.createUserWithFullSetup(testConstants.testUsers.user4, 'inactive_pref_user', uniDaoId, false);
    
    // Create user with inactive preference for ENS
    await UserFactory.createUserWithFullSetup(testConstants.testUsers.user5, 'user_inactive_pref', ensDaoId, false);
    
    // Setup proposals for both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos([testConstants.daoIds.uniswap, testConstants.daoIds.ens], 'inactive-test');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for exactly 1 message (only active user should be notified)
    await telegramHelper.waitForMessageCount(1, { timeout: timeouts.notification.delivery });
    
    // Verify the message was sent to the correct user
    const message = telegramHelper.getAllMessages()[0];
    expect(message.chatId).toBe(testConstants.testUsers.user1); // User with active UNI preference
    
    // Ensure no more messages are sent to inactive users
    await telegramHelper.waitForNoMessages(timeouts.notification.processing);
    
    // Verify total message count is still 1
    const allMessages = telegramHelper.getAllMessages();
    expect(allMessages).toHaveLength(1);
    
    // Verify users with inactive preferences were NOT notified
    const notifiedUsers = allMessages.map(msg => msg.chatId.toString());
    expect(notifiedUsers).not.toContain(testConstants.testUsers.user4); // User with inactive UNI preference
    expect(notifiedUsers).not.toContain(testConstants.testUsers.user5); // User with inactive ENS preference
    
    // Verify notification was only recorded for active user
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 1);
    const notification = await db(testConstants.tables.notifications).first();
    expect(notification.user_id).toBe(activeUser.user.id);
  });

});