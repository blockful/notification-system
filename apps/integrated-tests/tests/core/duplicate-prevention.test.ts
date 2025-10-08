import { describe, test, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, ProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('Duplicate Prevention - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let uniDaoId: string;
  let uniFollowerUserId: string;
  let bothFollowerUserId: string;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
    
    const now = new Date().toISOString();
    
    // Create DAO
    uniDaoId = testConstants.daoIds.uniswap;
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup(testConstants.profiles.p1.chatId, 'uni_follower', uniDaoId, true, now);
    const bothFollower = await UserFactory.createUserWithFullSetup(testConstants.profiles.p3.chatId, 'both_follower', uniDaoId, true, now);
    
    uniFollowerUserId = uniFollower.user.id;
    bothFollowerUserId = bothFollower.user.id;
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should not send duplicate notifications on repeated logic system triggers', async () => {
    // Clear any setup messages before starting the actual test
    if (global.mockTelegramSendMessage) {
      global.mockTelegramSendMessage.mockClear();
    }
    
    // Setup mock to return the same UNI proposal consistently
    const persistentProposal = ProposalFactory.createProposal(testConstants.daoIds.uniswap, 'persistent-uni-proposal');
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), [persistentProposal]);
    
    // Wait for first round of notifications (2 users should get notified)
    await telegramHelper.waitForMessageCount(2, { timeout: timeouts.notification.delivery });       
    // Verify notifications were sent to both users
    const firstRoundMessages = telegramHelper.getAllMessages();
    expect(firstRoundMessages).toHaveLength(2);
    expect(firstRoundMessages.some(msg => msg.chatId === testConstants.profiles.p1.chatId)).toBe(true);
    expect(firstRoundMessages.some(msg => msg.chatId === testConstants.profiles.p3.chatId)).toBe(true);
    
    // Verify notifications were recorded in database
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 2);
    
    // But no new notifications should be sent
    await telegramHelper.waitForNoMessages(timeouts.notification.processing);
    
    // Verify still only 2 notifications in database (no duplicates)
    const notificationCount = await db(testConstants.tables.notifications).count('* as count').first();
    expect(notificationCount?.count).toBe(2);
  });
});