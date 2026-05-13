import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { proposalsHandler, getDaosHandler, offchainProposalsHandler } from '@anticapture/client/msw';
import { HttpResponse } from 'msw';
import type { OnchainProposal } from '@notification-system/anticapture-client';
import { db, TestApps } from '../../src/setup';
import { server } from '../../src/setup/msw-server';
import { UserFactory, ProposalFactory } from '../../src/fixtures';
import { TelegramTestHelper, DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts } from '../../src/config';

const useDaoAndActiveProposal = (daoId: string, proposal: OnchainProposal) =>
  server.use(
    getDaosHandler({ items: [{ id: daoId, votingDelay: '0' }], totalCount: 1 }),
    offchainProposalsHandler({ items: [], totalCount: 0 }),
    proposalsHandler(({ request }) => {
      const statuses = new URL(request.url).searchParams.getAll('status').map(s => s.toLowerCase());
      const matchActive = statuses.length === 0 || statuses.includes((proposal.status || '').toLowerCase());
      const items = matchActive ? [proposal] : [];
      return HttpResponse.json({ items, totalCount: items.length });
    }),
  );

describe('Duplicate Prevention - Integration Test', () => {
  let apps: TestApps;
  let uniDaoId: string;
  let telegramHelper: TelegramTestHelper;
  let dbHelper: DatabaseTestHelper;

  beforeAll(async () => {
    apps = TestCleanup.getGlobalApps();
    telegramHelper = new TelegramTestHelper(global.telegramClient);
    dbHelper = new DatabaseTestHelper(db);

    const now = new Date().toISOString();
    uniDaoId = testConstants.daoIds.uniswap;

    await UserFactory.createUserWithFullSetup(testConstants.profiles.p1.chatId, 'uni_follower', uniDaoId, true, now);
    await UserFactory.createUserWithFullSetup(testConstants.profiles.p3.chatId, 'both_follower', uniDaoId, true, now);
  });

  afterEach(async () => {
    await TestCleanup.cleanupBetweenTests();
  });

  test('should not send duplicate notifications on repeated logic system triggers', async () => {
    global.telegramClient.clearCapturedCalls();

    const persistentProposal = ProposalFactory.createProposal(uniDaoId, 'persistent-uni-proposal');
    useDaoAndActiveProposal(uniDaoId, persistentProposal);

    await telegramHelper.waitForMessageCount(2, { timeout: timeouts.notification.delivery });
    const firstRoundMessages = telegramHelper.getAllMessages();
    expect(firstRoundMessages).toHaveLength(2);
    expect(firstRoundMessages.some(msg => msg.chatId === testConstants.profiles.p1.chatId)).toBe(true);
    expect(firstRoundMessages.some(msg => msg.chatId === testConstants.profiles.p3.chatId)).toBe(true);

    await dbHelper.waitForRecordCount(testConstants.tables.notifications, 2);

    await telegramHelper.waitForNoMessages(timeouts.notification.processing);

    const notificationCount = await db(testConstants.tables.notifications).count('* as count').first();
    expect(notificationCount?.count).toBe(2);
  });
});
