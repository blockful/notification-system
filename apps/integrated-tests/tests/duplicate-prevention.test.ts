import { describe, test, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { db } from '../src/setup/database/database-config';
import { TestApps } from '../src/setup/services/apps';
import { HttpClientMockSetup } from '../src/mocks/http-client-mock';
import { GraphQLMockSetup } from '../src/mocks/graphql-mock-setup';
import { UserFactory } from '../src/fixtures/factories/user-factory';
import { ProposalFactory } from '../src/fixtures/factories/proposal-factory';
import { TelegramTestHelper } from '../src/helpers/messaging/telegram-test-helper';
import { DatabaseTestHelper } from '../src/helpers/database/database-test-helper';
import { TestCleanup } from '../src/helpers/utilities/test-cleanup';

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
    telegramHelper = new TelegramTestHelper(global.mockSendMessage);
    dbHelper = new DatabaseTestHelper(db);
    
    const now = new Date().toISOString();
    
    // Create DAO
    uniDaoId = 'UNISWAP';
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true, now);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true, now);
    
    uniFollowerUserId = uniFollower.user.id;
    bothFollowerUserId = bothFollower.user.id;
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should not send duplicate notifications on repeated logic system triggers', async () => {
    // Setup mock to return the same UNI proposal consistently
    const persistentProposal = ProposalFactory.createProposal('UNISWAP', 'persistent-uni-proposal');
    GraphQLMockSetup.setupProposalMock(httpMockSetup.getMockClient(), [persistentProposal]);
    
    // Wait for first round of notifications (2 users should get notified)
    await telegramHelper.waitForMessageCount(2, { timeout: 3000 });
    
    // Verify notifications were sent to both users
    const firstRoundMessages = telegramHelper.getAllMessages();
    expect(firstRoundMessages).toHaveLength(2);
    expect(firstRoundMessages.some(msg => msg.chatId === '111111111')).toBe(true);
    expect(firstRoundMessages.some(msg => msg.chatId === '333333333')).toBe(true);
    
    // Verify notifications were recorded in database
    await dbHelper.waitForRecordCount('notifications', 2);
    
    // Wait a bit to ensure logic system triggers again (500ms interval)
    // But no new notifications should be sent
    await telegramHelper.waitForNoMessages(2000);
    
    // Verify still only 2 notifications in database (no duplicates)
    const notificationCount = await db('notifications').count('* as count').first();
    expect(notificationCount?.count).toBe(2);
  });
});