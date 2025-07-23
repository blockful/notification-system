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
    const uniDaoId = 'UNISWAP';
    const ensDaoId = 'ENS';
    
    // Create Users with subscriptions
    await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true);
    await UserFactory.createUserWithFullSetup('222222222', 'ens_follower', ensDaoId, true);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true);
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollower.user.id, ensDaoId, true);
    
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
    // Create DAOs
    const uniDaoId = 'UNISWAP';
    const ensDaoId = 'ENS';
    
    // Create Users with subscriptions
    const uniFollower = await UserFactory.createUserWithFullSetup('111111111', 'uni_follower', uniDaoId, true);
    const ensFollower = await UserFactory.createUserWithFullSetup('222222222', 'ens_follower', ensDaoId, true);
    const bothFollower = await UserFactory.createUserWithFullSetup('333333333', 'both_follower', uniDaoId, true);
    
    // Create second subscription for bothFollower
    await UserFactory.createUserPreference(bothFollower.user.id, ensDaoId, true);
    
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