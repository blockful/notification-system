import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, OffchainProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('New Offchain Proposal Trigger - Integration Test', () => {
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

  test('should send notification when new offchain proposal is created', async () => {
    const testUser = testConstants.profiles.p1;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-user-basic',
      testDaoId,
      true,
      pastTimestamp,
    );

    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-basic-${Date.now()}`, {
      title: 'Community Treasury Allocation',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('New Snapshot proposal') && msg.text.includes(proposal.title),
      { timeout: timeouts.notification.delivery },
    );

    expect(message.text).toContain('📋');
    expect(message.text).toContain('New Snapshot proposal');
    expect(message.text).toContain(testDaoId);
    expect(message.text).toContain(proposal.title);
    expect(message.chatId).toBe(testUser.chatId);
  });

  test('should include discussion link when discussion URL is present', async () => {
    const testUser = testConstants.profiles.p2;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-user-discussion',
      testDaoId,
      true,
      pastTimestamp,
    );

    const discussionUrl = 'https://forum.example.com/proposal-discussion';
    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-discuss-${Date.now()}`, {
      title: 'Proposal With Discussion',
      discussion: discussionUrl,
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('Proposal With Discussion'),
      { timeout: timeouts.notification.delivery },
    );

    expect(message.text).toContain('New Snapshot proposal');
    expect(message.chatId).toBe(testUser.chatId);

    const buttons = message.reply_markup?.inline_keyboard?.flat() ?? [];
    const discussionButton = buttons.find((btn: any) => btn.url === discussionUrl);
    expect(discussionButton).toBeDefined();
    expect(discussionButton.text).toBe('View Discussion');
  });

  test('should NOT notify users not subscribed to the DAO', async () => {
    const testUser = testConstants.profiles.p3;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-user-wrong-dao',
      'different-dao',
      true,
      pastTimestamp,
    );

    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-nosub-${Date.now()}`, {
      title: 'Proposal For Other DAO',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('Proposal For Other DAO'),
      { timeout: timeouts.wait.short },
    );

    await expect(messagePromise).rejects.toThrow('Telegram message not received');
  });

  test('should NOT send duplicate notifications for the same proposal', async () => {
    const testUser = testConstants.profiles.p4;
    const pastTimestamp = new Date(Date.now() - timeouts.wait.long).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-user-dup',
      testDaoId,
      true,
      pastTimestamp,
    );

    const proposal = OffchainProposalFactory.createProposal(testDaoId, `snap-dup-${Date.now()}`, {
      title: 'Duplicate Prevention Proposal',
    });

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const firstMessage = await telegramHelper.waitForMessage(
      msg => msg.text.includes('Duplicate Prevention Proposal'),
      { timeout: timeouts.notification.delivery },
    );

    expect(firstMessage).toBeDefined();

    apps.logicSystemApp.resetTriggers();

    const duplicatePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('Duplicate Prevention Proposal'),
      { timeout: timeouts.wait.short },
    );

    await expect(duplicatePromise).rejects.toThrow('Telegram message not received');
  });
});
