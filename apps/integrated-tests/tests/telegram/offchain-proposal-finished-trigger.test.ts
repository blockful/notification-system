import { describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import { db, TestApps } from '../../src/setup';
import { HttpClientMockSetup, GraphQLMockSetup } from '../../src/mocks';
import { UserFactory, OffchainProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

describe('Offchain Proposal Finished Trigger - Integration Test', () => {
  let apps: TestApps;
  let httpMockSetup: HttpClientMockSetup;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  const testDaoId = testConstants.daoIds.ens;

  const createFinishedOffchainProposal = (daoId: string, proposalId: string, overrides?: Partial<ReturnType<typeof OffchainProposalFactory.createProposal>>) => {
    const now = Math.floor(Date.now() / 1000);
    return OffchainProposalFactory.createProposal(daoId, proposalId, {
      state: 'closed',
      created: now - 7 * 24 * 60 * 60,
      end: now - 10,
      title: `Finished Snapshot Proposal ${proposalId}`,
      link: `https://snapshot.org/#/${daoId}/proposal/${proposalId}`,
      ...overrides,
    });
  };

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    httpMockSetup = TestCleanup.getGlobalHttpMockSetup();
    telegramHelper = new TelegramTestHelper(global.mockTelegramSendMessage);
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should send notification when offchain proposal finishes', async () => {
    const testUser = testConstants.profiles.p1;
    const proposalId = 'snap-finished-1';
    const pastTimestamp = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-finished-user-basic',
      testDaoId,
      true,
      pastTimestamp,
    );

    const proposal = createFinishedOffchainProposal(testDaoId, proposalId);

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const message = await telegramHelper.waitForMessage(
      msg => msg.text.includes('has ended') && msg.text.includes('Snapshot proposal'),
      { timeout: timeouts.notification.delivery },
    );

    expect(message.text).toBe(`📊 Snapshot proposal "Finished Snapshot Proposal ${proposalId}" has ended on DAO ${testDaoId}`);
    expect(message.chatId).toBe(testUser.chatId);
  });

  test('should send notification without title when title is empty', async () => {
    const testUser = testConstants.profiles.p2;
    const pastTimestamp = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-finished-user-notitle',
      testDaoId,
      true,
      pastTimestamp,
    );

    const proposal = createFinishedOffchainProposal(testDaoId, 'snap-notitle-1', {
      title: '',
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
      msg => msg.text.includes('A Snapshot proposal has ended'),
      { timeout: timeouts.notification.delivery },
    );

    expect(message.text).toBe(`📊 A Snapshot proposal has ended on DAO ${testDaoId}`);
    expect(message.chatId).toBe(testUser.chatId);
  });

  test('should process multiple finished offchain proposals', async () => {
    const testUser = testConstants.profiles.p4;
    const pastTimestamp = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-finished-user-multi',
      testDaoId,
      true,
      pastTimestamp,
    );

    const now = Math.floor(Date.now() / 1000);
    const proposals = [
      createFinishedOffchainProposal(testDaoId, 'snap-fin-1', { end: now - 10 }),
      createFinishedOffchainProposal(testDaoId, 'snap-fin-2', { end: now - 9 }),
      createFinishedOffchainProposal(testDaoId, 'snap-fin-3', { end: now - 8 }),
    ];

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      proposals,
    );

    await telegramHelper.waitForMessageCount(3, {
      timeout: timeouts.notification.delivery,
      fromUser: testUser.chatId,
    });

    const allMessages = telegramHelper.getAllMessages();
    const userMessages = allMessages.filter(msg => msg.chatId === testUser.chatId);

    expect(userMessages).toHaveLength(3);
    const messageTexts = userMessages.map(msg => msg.text).sort();
    expect(messageTexts).toEqual([
      `📊 Snapshot proposal "Finished Snapshot Proposal snap-fin-1" has ended on DAO ${testDaoId}`,
      `📊 Snapshot proposal "Finished Snapshot Proposal snap-fin-2" has ended on DAO ${testDaoId}`,
      `📊 Snapshot proposal "Finished Snapshot Proposal snap-fin-3" has ended on DAO ${testDaoId}`,
    ]);

    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 3);
  });

  test('should NOT notify users not subscribed to the DAO', async () => {
    const testUser = testConstants.profiles.p3;
    const pastTimestamp = new Date(Date.now() + testConstants.proposalTiming.subscriptionOffset).toISOString();

    await UserFactory.createUserWithFullSetup(
      testUser.chatId,
      'offchain-finished-user-wrong-dao',
      'different-dao',
      true,
      pastTimestamp,
    );

    const proposal = createFinishedOffchainProposal(testDaoId, 'snap-nosub-1');

    GraphQLMockSetup.setupMock(
      httpMockSetup.getMockClient(),
      [],
      [],
      {},
      [],
      [proposal],
    );

    const messagePromise = telegramHelper.waitForMessage(
      msg => msg.text.includes('Snapshot proposal') && msg.text.includes('has ended'),
      { timeout: timeouts.wait.short },
    );

    await expect(messagePromise).rejects.toThrow('Telegram message not received');
  });
});
