import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { proposalsHandler } from '@anticapture/client/msw';
import { CryptoUtil } from '@notification-system/subscription-server/dist/utils/crypto';
import { db, TestApps } from '../../src/setup';
import { server, proposalsByDaoResolver, TEST_TIMELOCK_DELAY } from '../../src/setup/msw-server';
import { UserFactory, ProposalFactory } from '../../src/fixtures';
import { DatabaseTestHelper, TestCleanup } from '../../src/helpers';
import { testConstants, timeouts, serviceConfig } from '../../src/config';

// The trigger computes the on-chain eta from API data: `queuedTimestamp + dao.timelockDelay`
// (plus a 60s wall-clock tolerance). `timelockDelay` comes from the `/daos` fixture in
// msw-server, so no logic-system configuration is involved.
const WEBHOOK_URL = 'http://relayer.railway.internal:3002/relay/webhook';
const TIMELOCK = Number(TEST_TIMELOCK_DELAY);

describe('Proposal Executable Trigger - webhook delivery', () => {
  let apps: TestApps;
  let dbHelper: DatabaseTestHelper;
  const received: any[] = [];

  beforeAll(() => {
    apps = TestCleanup.getGlobalApps();
    dbHelper = new DatabaseTestHelper(db);
  });

  beforeEach(async () => {
    await TestCleanup.cleanupBetweenTests();
    received.length = 0;
    server.use(
      http.post(WEBHOOK_URL, async ({ request }) => {
        received.push(await request.json());
        return HttpResponse.json({ accepted: true }, { status: 202 });
      }),
    );
  });

  // `users.secret` is stored encrypted at rest (subscription-server's
  // KnexUserRepository.findByIdsWithWorkspaceTokens decrypts it with
  // TOKEN_ENCRYPTION_KEY to populate the subscriber's bot_token). Seeding a raw
  // plaintext string there makes CryptoUtil.decrypt throw (caught and logged as
  // `secret.decrypt_failed`), leaving bot_token undefined and the consumer's
  // WebhookService skipping delivery (`webhook.skipped_unsigned`). So the seeded
  // value must be encrypted the same way the real subscription flow does it.
  //
  // No `updated_at` backdating needed: the dispatcher's ProposalExecutable handler
  // does not time-filter subscribers (see proposal-executable-trigger.service.ts).
  const registerRelayerWebhook = async () => {
    const user = await UserFactory.createUser(WEBHOOK_URL, 'relayer', 'webhook');
    const encryptedSecret = CryptoUtil.encrypt('test-secret', serviceConfig.oauth.tokenEncryptionKey);
    await db(testConstants.tables.users).where({ id: user.id }).update({ secret: encryptedSecret });
    await UserFactory.createUserPreference(user.id, testConstants.daoIds.ens, true);
    return user;
  };

  test('delivers exactly one webhook for a proposal whose timelock eta has passed', async () => {
    const now = Math.floor(Date.now() / 1000);
    await registerRelayerWebhook();

    const proposal = ProposalFactory.createProposal(testConstants.daoIds.ens, 'executable-1', {
      status: 'PENDING_EXECUTION',
      endTimestamp: now - TIMELOCK - 3_600,
      queuedTimestamp: now - TIMELOCK - 120, // eta passed 2 minutes ago
      description: '# Executable\n\nReady.',
    });
    server.use(proposalsHandler(proposalsByDaoResolver([proposal])));

    await dbHelper.waitForRecordCount(
      testConstants.tables.notifications,
      1,
      undefined,
      { timeout: timeouts.notification.delivery },
    );

    expect(received).toHaveLength(1);
    expect(received[0].metadata).toMatchObject({
      triggerType: 'proposalExecutable',
      daoId: testConstants.daoIds.ens,
      proposalId: 'executable-1',
      status: 'PENDING_EXECUTION',
    });

    // The trigger has no cursor: it re-fetches the same proposal every poll cycle
    // (500ms in the test harness; the wait below covers several). Exactly-once
    // delivery here is the dispatcher's DB-backed shouldSend/markAsSent idempotency
    // against the `notifications` table.
    await new Promise(r => setTimeout(r, timeouts.notification.delivery));
    expect(received).toHaveLength(1);
  });

  test('does not deliver a PENDING_EXECUTION proposal whose timelock eta has not passed', async () => {
    const now = Math.floor(Date.now() / 1000);
    await registerRelayerWebhook();

    // Queued late: the API already flags PENDING_EXECUTION (endTimestamp + delay passed),
    // but the real eta (queuedTimestamp + delay) is still 10 minutes away.
    const proposal = ProposalFactory.createProposal(testConstants.daoIds.ens, 'too-soon-1', {
      status: 'PENDING_EXECUTION',
      endTimestamp: now - TIMELOCK - 3_600,
      queuedTimestamp: now - TIMELOCK + 600,
    });
    server.use(proposalsHandler(proposalsByDaoResolver([proposal])));

    await new Promise(r => setTimeout(r, timeouts.notification.delivery));
    expect(received).toHaveLength(0);
  });
});
