import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, OffchainProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';
import { NotificationTypeId } from '@notification-system/messages';

describe('Notification Settings Filtering - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = testConstants.daoIds.ens;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should NOT notify user who opted out of new-offchain-proposal', async () => {
    const testUser = testConstants.profiles.p5;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    // Create user with DAO subscription
    const { user } = await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'settings-optout-user',
      testDaoId,
      true,
      pastTimestamp,
    );

    // Opt out of 'new-offchain-proposal' by inserting into user_notification_preferences
    await db('user_notification_preferences').insert({
      user_id: user.id,
      trigger_type: NotificationTypeId.NewOffchainProposal,
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    // Set up mock with offchain proposal
    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-optout-${Date.now()}`, {
      title: 'Opted Out Proposal',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    // Assert: should NOT receive notification (expect timeout)
    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('Opted Out Proposal'),
      { timeout: timeouts.wait.short },
    );

    await expect(messagePromise).rejects.toThrow('Telegram message not received');
  });

  test('should notify user with no notification preferences (default = all enabled)', async () => {
    const testUser = testConstants.profiles.p6;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    // Create user with DAO subscription, NO notification preferences inserted
    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'settings-default-user',
      testDaoId,
      true,
      pastTimestamp,
    );

    // Set up mock with offchain proposal
    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-default-${Date.now()}`, {
      title: 'Default Behavior Proposal',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    // Assert: should receive notification (opt-out model: missing row = enabled)
    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('Default Behavior Proposal'),
      { timeout: timeouts.notification.delivery },
    );

    expect(message.text).toContain('New Snapshot proposal');
    expect(message.chatId).toBe(testUser.chatId);
  });
});
