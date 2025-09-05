import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { db, TestApps } from '../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../src/mocks';
import { UserFactory, ProposalFactory } from '../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../src/helpers';
import { testConstants, timeouts } from '../src/config';

describe('Multi-DAO Notification Flow - Integration Test', () => {
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

  test('Both DAOs proposals should notify user following both DAOs twice', async () => {
    // Create DAOs
    const uniDaoId = testConstants.daoIds.uniswap;
    const ensDaoId = testConstants.daoIds.ens;
    
    // Create Users with subscriptions
    await UserFactory.createUserWithFullSetup(testConstants.profiles.p1.chatId, 'uni_follower', uniDaoId, true);
    await UserFactory.createUserWithFullSetup(testConstants.profiles.p2.chatId, 'ens_follower', ensDaoId, true);
    const bothFollower = await UserFactory.createUserWithFullSetup(testConstants.profiles.p3.chatId, 'both_follower', uniDaoId, true);
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollower.user.id, ensDaoId, true);
    
    // Setup mock to return active proposals from both DAOs
    const proposals = ProposalFactory.createProposalsForMultipleDaos([testConstants.daoIds.uniswap, testConstants.daoIds.ens], 'multi-proposal');
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), proposals);
    
    // Wait for all expected messages
    await telegramHelper.waitForMessageCount(4, { timeout: timeouts.notification.delivery });
    
    // Get all messages after they arrive
    const allMessages = telegramHelper.getAllMessages();
    
    // Verify UNI follower received 1 message
    const uniFollowerMessages = allMessages.filter(msg => msg.chatId === testConstants.profiles.p1.chatId);
    expect(uniFollowerMessages).toHaveLength(1);
    expect(uniFollowerMessages[0].text).toContain(testConstants.daoIds.uniswap);
    
    // Verify ENS follower received 1 message
    const ensFollowerMessages = allMessages.filter(msg => msg.chatId === testConstants.profiles.p2.chatId);
    expect(ensFollowerMessages).toHaveLength(1);
    expect(ensFollowerMessages[0].text).toContain(testConstants.daoIds.ens);
    
    // Verify both follower received 2 messages
    const bothFollowerMessages = allMessages.filter(msg => msg.chatId === testConstants.profiles.p3.chatId);
    expect(bothFollowerMessages).toHaveLength(2);
    
    // Verify database records
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 4);
  });

  test('should handle multiple simultaneous proposals from same DAO', async () => {
    // Create DAOs
    const uniDaoId = testConstants.daoIds.uniswap;
    const ensDaoId = testConstants.daoIds.ens;
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup(testConstants.profiles.p1.chatId, 'uni_follower', uniDaoId, true);
    const ensFollower = await UserFactory.createUserWithFullSetup(testConstants.profiles.p2.chatId, 'ens_follower', ensDaoId, true);
    const bothFollower = await UserFactory.createUserWithFullSetup(testConstants.profiles.p3.chatId, 'both_follower', uniDaoId, true);
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollower.user.id, ensDaoId, true);
    
    // Setup multiple UNI proposals simultaneously
    const multipleUniProposals = ProposalFactory.createMultipleProposals(testConstants.daoIds.uniswap, 3, 'uni-multi');
    GraphQLMockSetup.setupMock(httpMockSetup.getMockClient(), multipleUniProposals);
    
    // Wait for all 6 messages (3 proposals × 2 UNI followers)
    await telegramHelper.waitForMessageCount(6);
    
    // Get all messages and verify distribution
    const allMessages = telegramHelper.getAllMessages();
    
    // Verify UNI follower received 3 messages
    const uniFollowerMessages = allMessages.filter(msg => msg.chatId === testConstants.profiles.p1.chatId);
    expect(uniFollowerMessages).toHaveLength(3);
    
    // Verify both follower received 3 messages
    const bothFollowerMessages = allMessages.filter(msg => msg.chatId === testConstants.profiles.p3.chatId);
    expect(bothFollowerMessages).toHaveLength(3);
    
    // Verify ENS follower did NOT receive any messages
    const ensFollowerMessages = allMessages.filter(msg => msg.chatId === testConstants.profiles.p2.chatId);
    expect(ensFollowerMessages).toHaveLength(0);
    
    // Verify all notifications were sent
    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 6);
    
    // Verify they are all for UNISWAP
    const notifications = await db(testConstants.tables.notifications).where({ dao_id: testConstants.daoIds.uniswap });
    expect(notifications).toHaveLength(6);
  });
});