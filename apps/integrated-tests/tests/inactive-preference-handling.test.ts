import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db } from '../src/setup/database-config';
import { TestApps } from '../src/setup/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
import { UserFactory } from '../src/test-data/user-factory';
import { ProposalFactory } from '../src/test-data/proposal-factory';
import { TelegramTestHelper } from '../src/helpers/telegram-test-helper';
import { DatabaseTestHelper } from '../src/helpers/database-test-helper';
import { TestCleanup } from '../src/helpers/test-cleanup';

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
    const uniDaoId = 'UNISWAP';
    const ensDaoId = 'ENS';
    
    // Create user that follows UNI with active preference
    const activeUser = await UserFactory.createUserWithFullSetup('111111111', 'active_user', uniDaoId, true);
    
    // Create user that follows UNI but with INACTIVE preference
    await UserFactory.createUserWithFullSetup('555555555', 'inactive_pref_user', uniDaoId, false);
    
    // Create user with inactive preference for ENS
    await UserFactory.createUserWithFullSetup('666666666', 'user_inactive_pref', ensDaoId, false);
    
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
    expect(notification.user_id).toBe(activeUser.user.id);
  });

});